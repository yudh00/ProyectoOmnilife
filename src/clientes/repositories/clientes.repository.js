// =====================================================================
// REPOSITORY: clientes.repository.js
// Capa de acceso a datos. Solo llama a los Stored Procedures.
// No contiene lógica de negocio ni validaciones.
// Misma convención que ventas.repository.js.
// =====================================================================

const db = require('../../config/db');

// ---------------------------------------------------------------------
// LISTADO / BÚSQUEDA
// ---------------------------------------------------------------------

async function listarClientes(busqueda = null) {
  const { rows } = await db.query('SELECT * FROM sp_listar_clientes($1)', [busqueda]);
  return rows;
}

async function obtenerClientePorId(idCliente) {
  const { rows } = await db.query('SELECT * FROM sp_obtener_cliente_por_id($1)', [idCliente]);
  return rows[0] || null;
}

// ---------------------------------------------------------------------
// CREACIÓN
// ---------------------------------------------------------------------

async function crearCliente({ nombre, apellidos, correo, telefono }) {
  const { rows } = await db.query(
    'SELECT * FROM sp_crear_cliente($1, $2, $3, $4)',
    [nombre, apellidos, correo, telefono]
  );
  return rows[0];
}

// ---------------------------------------------------------------------
// ACTUALIZACIÓN
// ---------------------------------------------------------------------

async function actualizarCliente(idCliente, { nombre, apellidos, correo, telefono, isActivo }) {
  const { rows } = await db.query(
    'SELECT * FROM sp_actualizar_cliente($1, $2, $3, $4, $5, $6)',
    [idCliente, nombre, apellidos, correo, telefono, isActivo]
  );
  return rows[0];
}

// ---------------------------------------------------------------------
// BORRADO LÓGICO (soft delete)
// ---------------------------------------------------------------------

async function desactivarCliente(idCliente) {
  const { rows } = await db.query(
    'SELECT sp_desactivar_cliente($1) AS exito',
    [idCliente]
  );
  return rows[0].exito;
}

// ---------------------------------------------------------------------
// HISTORIAL TRANSACCIONAL
// ---------------------------------------------------------------------

async function obtenerHistorialCliente(idCliente) {
  const { rows } = await db.query(
    'SELECT * FROM sp_obtener_historial_cliente($1)',
    [idCliente]
  );
  return rows;
}

module.exports = {
  listarClientes,
  obtenerClientePorId,
  crearCliente,
  actualizarCliente,
  desactivarCliente,
  obtenerHistorialCliente,
};
