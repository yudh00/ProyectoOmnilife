// =====================================================================
// SERVICE: clientes.service.js
// Capa de lógica de negocio. Aplica reglas de dominio RF-04/RF-05/RF-06.
//
// MEJORAS SOLID respecto al módulo de ventas:
//
// 1. Dependency Inversion Principle (DIP):
//    El servicio no importa el repositorio directamente. Recibe el repo
//    como parámetro en `crearServicioClientes(repo)`. Esto permite
//    inyectar un repositorio mock en pruebas unitarias sin tocar el código
//    de producción.
//
// 2. DTO / Mapper pattern:
//    Las funciones `mapearCliente` y `mapearHistorial` transforman las
//    filas crudas de PostgreSQL al formato que espera la GUI (camelCase,
//    estructura Client/TransactionHistory). El servicio actúa como
//    frontera entre el modelo relacional y el modelo de la API.
//
// 3. Single Responsibility Principle (SRP):
//    La validación de formato está en clientes.validator.js.
//    El mapeo de filas está en las funciones de mapper de este archivo.
//    La lógica de negocio (unicidad, existencia, etc.) está aquí.

const validator = require('../validators/clientes.validator');
const AppError   = require('../../utils/AppError');

// MAPPERS (patrón DTO)
// Transforman filas de BD (snake_case/lowercase pg) al formato
// que espera la GUI TypeScript (camelCase, Client interface).

/**
 * Convierte una fila de sp_listar_clientes o sp_obtener_cliente_por_id
 * al objeto Client que espera el frontend.
 */
function mapearCliente(row) {
  return {
    id:           row.idcliente,
    firstName:    row.nombreusuario,
    lastName:     row.apellidosusuario,
    email:        row.correoelectronico,
    phone:        row.telefonousuario || '',
    registeredAt: row.fecharegistro,
    isActive:     row.isactivo,
    // La GUI usa transactions.length como contador de compras.
    // En el listado devolvemos un array vacío + el total real del SP.
    // Para el historial completo usar GET /api/clientes/:id/historial.
    transactions:      [],
    totalTransactions: row.totalpedidos !== undefined
      ? parseInt(row.totalpedidos, 10)
      : undefined,
  };
}

/**
 * Convierte las filas planas de sp_obtener_historial_cliente en un
 * array de objetos TransactionHistory (formato GUI).
 * Ordena más recientes primero (RF-06: cronológico desc).
 */
function mapearHistorial(filas) {
  const pedidosMap = new Map();

  for (const fila of filas) {
    if (!pedidosMap.has(fila.idpedido)) {
      pedidosMap.set(fila.idpedido, {
        id:     fila.idpedido,
        date:   fila.fechapedido,
        estado: fila.estadopedido,
        items:  [],
        total:  parseFloat(fila.total),
      });
    }
    // Una fila puede no tener producto si el pedido no tiene líneas
    if (fila.idproducto) {
      pedidosMap.get(fila.idpedido).items.push({
        productName: fila.nombreproducto,
        quantity:    fila.cantidad,
        unitPrice:   parseFloat(fila.preciocongelado),
      });
    }
  }

  // Ordenar por fecha desc (el SP ya ordena, pero garantizamos aquí también)
  return Array.from(pedidosMap.values()).sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
}

// FACTORY DE SERVICIO — Dependency Inversion Principle

/**
 * Crea una instancia del servicio de clientes con el repositorio inyectado.
 * Uso en producción:  `crearServicioClientes(repo)` (ver export al final).
 * Uso en tests:       `crearServicioClientes(repoMock)`.
 *
 * @param {typeof import('../repositories/clientes.repository')} repo
 */
function crearServicioClientes(repo) {

  // LISTAR / BUSCAR

  async function listarClientes(busqueda = null) {
    // Normalizar: string vacío → null (el SP retorna todos si null)
    const termino = busqueda && busqueda.trim() ? busqueda.trim() : null;
    const filas   = await repo.listarClientes(termino);
    return filas.map(mapearCliente);
  }

  // OBTENER POR ID

  async function obtenerCliente(idCliente) {
    const id = parseInt(idCliente, 10);
    if (!Number.isInteger(id) || id <= 0) {
      throw AppError.badRequest('ID de cliente inválido');
    }
    const fila = await repo.obtenerClientePorId(id);
    if (!fila) throw AppError.notFound(`Cliente ${id} no encontrado`);
    return mapearCliente(fila);
  }

  // CREAR  (RF-04, HU-02)

  async function crearCliente(datos) {
    validator.validarCliente(datos);

    try {
      const fila = await repo.crearCliente(datos);
      return mapearCliente(fila);
    } catch (err) {
      if (err.code === '23505' || (err.message && err.message.includes('ya está registrado'))) {
        throw AppError.conflict('El correo electrónico ya está registrado');
      }
      throw err;
    }
  }

  // ACTUALIZAR  (RF-05, HU-03)

  async function actualizarCliente(idCliente, datos) {
    const id = parseInt(idCliente, 10);
    if (!Number.isInteger(id) || id <= 0) {
      throw AppError.badRequest('ID de cliente inválido');
    }

    validator.validarCliente(datos);

    // Verificar existencia antes de intentar actualizar
    const existente = await repo.obtenerClientePorId(id);
    if (!existente) throw AppError.notFound(`Cliente ${id} no encontrado`);

    try {
      const fila = await repo.actualizarCliente(id, datos);
      return mapearCliente(fila);
    } catch (err) {
      if (err.code === '23505' || (err.message && err.message.includes('ya está registrado'))) {
        throw AppError.conflict('El correo electrónico ya está registrado por otro cliente');
      }
      throw err;
    }
  }

  // DESACTIVAR — soft delete  (RF-05, HU-03, regla 3.5.3)
  // No elimina registros; preserva historial transaccional del cliente.

  async function desactivarCliente(idCliente) {
    const id = parseInt(idCliente, 10);
    if (!Number.isInteger(id) || id <= 0) {
      throw AppError.badRequest('ID de cliente inválido');
    }

    const existente = await repo.obtenerClientePorId(id);
    if (!existente) throw AppError.notFound(`Cliente ${id} no encontrado`);

    await repo.desactivarCliente(id);
    return { mensaje: 'Cliente desactivado correctamente' };
  }

  // HISTORIAL TRANSACCIONAL  (RF-06, HU-03)
  // Lee los Pedidos generados por el módulo de Ventas (relación 1-N).
  // Devuelve ordenado más reciente primero.
  //
  // TODO seguridad: cuando el módulo de Seguridad esté listo, verificar
  // aquí que req.user.idCliente === idCliente || req.user.rol === 'Administrador'
  // y lanzar AppError.forbidden() si no cumple (regla 3.5.3).

  async function obtenerHistorial(idCliente) {
    const id = parseInt(idCliente, 10);
    if (!Number.isInteger(id) || id <= 0) {
      throw AppError.badRequest('ID de cliente inválido');
    }

    const existente = await repo.obtenerClientePorId(id);
    if (!existente) throw AppError.notFound(`Cliente ${id} no encontrado`);

    const filas = await repo.obtenerHistorialCliente(id);
    return mapearHistorial(filas);
  }

  return {
    listarClientes,
    obtenerCliente,
    crearCliente,
    actualizarCliente,
    desactivarCliente,
    obtenerHistorial,
  };
}

// Exports

// Instancia de producción (usa el repositorio real)
const repo = require('../repositories/clientes.repository');
module.exports = crearServicioClientes(repo);

// Factory exportada con nombre para inyección en tests unitarios:
//   const { crearServicioClientes } = require('./clientes.service');
//   const svc = crearServicioClientes(repoMock);
module.exports.crearServicioClientes = crearServicioClientes;
