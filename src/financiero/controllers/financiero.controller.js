// =====================================================================
// CONTROLLER: financiero.controller.js
// Capa HTTP para el módulo financiero. Valida parámetros mínimos,
// llama al service y devuelve respuestas uniformes usando utils/response.
// =====================================================================

const service = require('../services/financiero.service');
const { ok, fail } = require('../../utils/response');

async function getIngresosPeriodo(req, res) {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const result = await service.obtenerIngresosPeriodo(fechaInicio, fechaFin);
    return ok(res, result);
  } catch (err) {
    return fail(res, err);
  }
}

async function getGastosPeriodo(req, res) {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const result = await service.obtenerGastosPeriodo(fechaInicio, fechaFin);
    return ok(res, result);
  } catch (err) {
    return fail(res, err);
  }
}

async function getFlujoCajaNeto(req, res) {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const result = await service.obtenerFlujoCajaNeto(fechaInicio, fechaFin);
    return ok(res, result);
  } catch (err) {
    return fail(res, err);
  }
}

async function getEstadisticasPeriodo(req, res) {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const result = await service.obtenerEstadisticasPeriodo(fechaInicio, fechaFin);
    return ok(res, result);
  } catch (err) {
    return fail(res, err);
  }
}

async function getRentabilidadPeriodo(req, res) {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const result = await service.obtenerRentabilidadPorPeriodo(fechaInicio, fechaFin);
    return ok(res, result);
  } catch (err) {
    return fail(res, err);
  }
}

async function getRentabilidadProducto(req, res) {
  try {
    const idProducto = req.params.idProducto || req.params.id;
    const result = await service.calcularRentabilidadProducto(idProducto);
    return ok(res, result);
  } catch (err) {
    return fail(res, err);
  }
}

module.exports = {
  getIngresosPeriodo,
  getGastosPeriodo,
  getFlujoCajaNeto,
  getEstadisticasPeriodo,
  getRentabilidadPeriodo,
  getRentabilidadProducto,
};
