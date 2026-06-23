// =====================================================================
// REPOSITORY: financiero.repository.js
// Capa de acceso a datos para el módulo financiero.
// Sigue la convención de `src/clientes/repositories/clientes.repository.js`.
// =====================================================================

const db = require('../../config/db');

// ---------------------------------------------------------------------
// INGRESOS / GASTOS / FLUJO
// ---------------------------------------------------------------------

async function obtenerIngresosPeriodo(fechaInicio, fechaFin) {
  const sql = 'SELECT * FROM sp_obtener_ingresos_periodo($1, $2)';
  const { rows } = await db.query(sql, [fechaInicio, fechaFin]);
  return rows[0] || null;
}

async function obtenerGastosPeriodo(fechaInicio, fechaFin) {
  const sql = 'SELECT * FROM sp_obtener_gastos_periodo($1, $2)';
  const { rows } = await db.query(sql, [fechaInicio, fechaFin]);
  return rows[0] || null;
}

async function obtenerFlujoCajaNeto(fechaInicio, fechaFin) {
  const sql = 'SELECT * FROM sp_obtener_flujo_caja_neto($1, $2)';
  const { rows } = await db.query(sql, [fechaInicio, fechaFin]);
  return rows[0] || null;
}

// ---------------------------------------------------------------------
// ESTADISTICAS / RENTABILIDAD
// ---------------------------------------------------------------------

async function obtenerEstadisticasPeriodo(fechaInicio, fechaFin) {
  const sql = 'SELECT * FROM sp_obtener_estadisticas_periodo($1, $2)';
  const { rows } = await db.query(sql, [fechaInicio, fechaFin]);
  return rows[0] || null;
}

async function obtenerRentabilidadPorPeriodo(fechaInicio, fechaFin) {
  const sql = 'SELECT * FROM sp_rentabilidad_por_periodo($1, $2)';
  const { rows } = await db.query(sql, [fechaInicio, fechaFin]);
  return rows[0] || null;
}

// ---------------------------------------------------------------------
// PRODUCTO
// ---------------------------------------------------------------------

async function calcularRentabilidadProducto(idProducto) {
  const sql = 'SELECT * FROM sp_calcular_rentabilidad_producto($1)';
  const { rows } = await db.query(sql, [idProducto]);
  return rows[0] || null;
}

module.exports = {
  obtenerIngresosPeriodo,
  obtenerGastosPeriodo,
  obtenerFlujoCajaNeto,
  obtenerEstadisticasPeriodo,
  obtenerRentabilidadPorPeriodo,
  calcularRentabilidadProducto,
};
