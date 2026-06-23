// =====================================================================
// CONTROLLER: clientes.controller.js
// Capa HTTP. Recibe req/res, traduce el cuerpo de la GUI al formato
// interno del dominio, llama al service y estructura la respuesta.
// No contiene lógica de negocio.
//
// Mejora sobre ventas.controller.js:
//   Usa los helpers `ok`, `created` y `fail` de utils/response.js
//   en lugar de repetir res.json({ ok: true, data }) localmente.
//
// Patrón DTO de entrada:
//   La GUI envía camelCase inglés (firstName, lastName, isActive…).
//   El controller transforma al dominio en español antes de pasarlo
//   al service (nombre, apellidos, correo, telefono, isActivo).
// =====================================================================

const service             = require('../services/clientes.service');
const { ok, created, fail } = require('../../utils/response');

// ---------------------------------------------------------------------
// LISTADO / BÚSQUEDA
// GET /api/clientes
// GET /api/clientes?busqueda=Juan
// ---------------------------------------------------------------------

async function getClientes(req, res) {
  try {
    const { busqueda } = req.query;
    const clientes = await service.listarClientes(busqueda || null);
    return ok(res, clientes);
  } catch (err) {
    return fail(res, err);
  }
}

// ---------------------------------------------------------------------
// DETALLE
// GET /api/clientes/:id
// ---------------------------------------------------------------------

async function getCliente(req, res) {
  try {
    const cliente = await service.obtenerCliente(req.params.id);
    return ok(res, cliente);
  } catch (err) {
    return fail(res, err);
  }
}

// ---------------------------------------------------------------------
// CREAR
// POST /api/clientes
// Body: { firstName, lastName, email, phone }
// ---------------------------------------------------------------------

async function postCliente(req, res) {
  try {
    const datos = {
      nombre:    req.body.firstName,
      apellidos: req.body.lastName,
      correo:    req.body.email,
      telefono:  req.body.phone,
    };
    const nuevo = await service.crearCliente(datos);
    return created(res, nuevo);
  } catch (err) {
    return fail(res, err);
  }
}

// ---------------------------------------------------------------------
// ACTUALIZAR
// PUT /api/clientes/:id
// Body: { firstName, lastName, email, phone, isActive }
// ---------------------------------------------------------------------

async function putCliente(req, res) {
  try {
    const datos = {
      nombre:    req.body.firstName,
      apellidos: req.body.lastName,
      correo:    req.body.email,
      telefono:  req.body.phone,
      isActivo:  req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
    };
    const actualizado = await service.actualizarCliente(req.params.id, datos);
    return ok(res, actualizado);
  } catch (err) {
    return fail(res, err);
  }
}

// ---------------------------------------------------------------------
// DESACTIVAR (soft delete — borrado lógico)
// DELETE /api/clientes/:id
// No elimina el registro; pone IsActivo = false (RF-05).
// ---------------------------------------------------------------------

async function deleteCliente(req, res) {
  try {
    const resultado = await service.desactivarCliente(req.params.id);
    return ok(res, resultado);
  } catch (err) {
    return fail(res, err);
  }
}

// ---------------------------------------------------------------------
// HISTORIAL TRANSACCIONAL
// GET /api/clientes/:id/historial
// Retorna los pedidos del cliente (generados por el módulo de Ventas),
// ordenados más recientes primero (RF-06).
// ---------------------------------------------------------------------

async function getHistorial(req, res) {
  try {
    const historial = await service.obtenerHistorial(req.params.id);
    return ok(res, historial);
  } catch (err) {
    return fail(res, err);
  }
}

module.exports = {
  getClientes,
  getCliente,
  postCliente,
  putCliente,
  deleteCliente,
  getHistorial,
};
