// =====================================================================
// SERVICE: financiero.service.js
// Lógica de negocio para el módulo financiero. Valida parámetros,
// llama al repositorio y normaliza resultados para la API.
// Implementa factory `crearServicioFinanciero(repo)` para test y DI.
// =====================================================================

const AppError = require('../../utils/AppError');

function validarFechas(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) throw AppError.badRequest('fechaInicio y fechaFin son requeridas');

  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
    throw AppError.badRequest('fechaInicio o fechaFin inválida');
  }

  if (inicio > fin) throw AppError.badRequest('fechaInicio no puede ser posterior a fechaFin');

  // Convertir a YYYY-MM-DD (sin hora) para pasar al repo/SP si es necesario
  const toDateOnly = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return { inicio: toDateOnly(inicio), fin: toDateOnly(fin) };
}

function parseNumericRow(row, numericFields = []) {
  if (!row) return null;
  const out = { ...row };
  for (const f of numericFields) {
    if (out[f] === null || out[f] === undefined) out[f] = 0;
    else out[f] = typeof out[f] === 'number' ? out[f] : parseFloat(out[f]);
  }
  return out;
}

function crearServicioFinanciero(repo) {

  async function obtenerIngresosPeriodo(fechaInicio, fechaFin) {
    const { inicio, fin } = validarFechas(fechaInicio, fechaFin);
    const fila = await repo.obtenerIngresosPeriodo(inicio, fin);
    // sp_obtener_ingresos_periodo retorna TotalIngresos, CantidadPedidosPagados, FechaInicio, FechaFin
    if (!fila) return { TotalIngresos: 0, CantidadPedidosPagados: 0, FechaInicio: inicio, FechaFin: fin };
    const mapped = parseNumericRow(fila, ['totalingresos']);
    // Normalizar nombres en camelCase y casing esperado por frontend si se desea
    return {
      totalIngresos: mapped.totalingresos ?? mapped.totalingresos ?? 0,
      cantidadPedidosPagados: mapped.cantidadpedidospagados !== undefined ? parseInt(mapped.cantidadpedidospagados, 10) : 0,
      fechaInicio: fila.fechainicio || inicio,
      fechaFin: fila.fechafin || fin,
    };
  }

  async function obtenerGastosPeriodo(fechaInicio, fechaFin) {
    const { inicio, fin } = validarFechas(fechaInicio, fechaFin);
    const fila = await repo.obtenerGastosPeriodo(inicio, fin);
    if (!fila) return { totalGastos: 0, cantidadMovimientos: 0, fechaInicio: inicio, fechaFin: fin, detalleGastos: '' };
    return {
      totalGastos: fila.totalgastos !== undefined ? parseFloat(fila.totalgastos) : 0,
      cantidadMovimientos: fila.cantidadmovimientos !== undefined ? parseInt(fila.cantidadmovimientos, 10) : 0,
      fechaInicio: fila.fechainicio || inicio,
      fechaFin: fila.fechafin || fin,
      detalleGastos: fila.detallegastos || '',
    };
  }

  async function obtenerFlujoCajaNeto(fechaInicio, fechaFin) {
    const { inicio, fin } = validarFechas(fechaInicio, fechaFin);
    const fila = await repo.obtenerFlujoCajaNeto(inicio, fin);
    if (!fila) return { totalIngresos: 0, totalEgresos: 0, flujoCajaNeto: 0, cantidadIngresos: 0, cantidadEgresos: 0 };
    return {
      totalIngresos: fila.totalingresos !== undefined ? parseFloat(fila.totalingresos) : 0,
      totalEgresos: fila.totalegresos !== undefined ? parseFloat(fila.totalegresos) : 0,
      flujoCajaNeto: fila.flujocajaneto !== undefined ? parseFloat(fila.flujocajaneto) : 0,
      cantidadIngresos: fila.cantidadingresos !== undefined ? parseInt(fila.cantidadingresos, 10) : 0,
      cantidadEgresos: fila.cantidadegresos !== undefined ? parseInt(fila.cantidadegresos, 10) : 0,
    };
  }

  async function obtenerEstadisticasPeriodo(fechaInicio, fechaFin) {
    const { inicio, fin } = validarFechas(fechaInicio, fechaFin);
    const fila = await repo.obtenerEstadisticasPeriodo(inicio, fin);
    if (!fila) return null;
    return {
      totalIngresos: fila.totalingresos !== undefined ? parseFloat(fila.totalingresos) : 0,
      totalEgresos: fila.totalegresos !== undefined ? parseFloat(fila.totalegresos) : 0,
      flujoCajaNeto: fila.flujocajaneto !== undefined ? parseFloat(fila.flujocajaneto) : 0,
      ticketPromedio: fila.ticketpromedio !== undefined ? parseFloat(fila.ticketpromedio) : 0,
      pedidosCompletados: fila.pedidoscompletados !== undefined ? parseInt(fila.pedidoscompletados, 10) : 0,
      pedidosCancelados: fila.pedidoscancelados !== undefined ? parseInt(fila.pedidoscancelados, 10) : 0,
      gastoPromedioPorPedido: fila.gastopromedioporpedido !== undefined ? parseFloat(fila.gastopromedioporpedido) : 0,
      rentabilidadPromedioProductos: fila.rentabilidadpromedioproductos !== undefined ? parseFloat(fila.rentabilidadpromedioproductos) : 0,
      margenPromedioPorcentual: fila.margenpromedioporcentual !== undefined ? parseFloat(fila.margenpromedioporcentual) : 0,
      diasMedidos: fila.diasmedidos !== undefined ? parseInt(fila.diasmedidos, 10) : null,
    };
  }

  async function obtenerRentabilidadPorPeriodo(fechaInicio, fechaFin) {
    const { inicio, fin } = validarFechas(fechaInicio, fechaFin);
    const fila = await repo.obtenerRentabilidadPorPeriodo(inicio, fin);
    if (!fila) return { fechaInicio: inicio, fechaFin: fin, totalIngresos: 0, totalEgresos: 0, rentabilidadNeta: 0 };
    return {
      fechaInicio: fila.fechainicio || inicio,
      fechaFin: fila.fechafin || fin,
      totalIngresos: fila.totalingresos !== undefined ? parseFloat(fila.totalingresos) : 0,
      totalEgresos: fila.totalegresos !== undefined ? parseFloat(fila.totalegresos) : 0,
      rentabilidadNeta: fila.rentabilidadneta !== undefined ? parseFloat(fila.rentabilidadneta) : 0,
    };
  }

  async function calcularRentabilidadProducto(idProducto) {
    const id = parseInt(idProducto, 10);
    if (!Number.isInteger(id) || id <= 0) throw AppError.badRequest('Id de producto inválido');
    const fila = await repo.calcularRentabilidadProducto(id);
    if (!fila) {
      const err = new Error('Producto no encontrado');
      err.status = 404;
      throw err;
    }
    return {
      idProducto: fila.idproducto,
      nombreProducto: fila.nombreproducto,
      precioVenta: parseFloat(fila.precioventa),
      costoAdquisicion: parseFloat(fila.costoadquisicion),
      rentabilidadUnitaria: parseFloat(fila.rentabilidadunitaria),
      margenPorcentual: parseFloat(fila.margenporcentual),
    };
  }

  return {
    obtenerIngresosPeriodo,
    obtenerGastosPeriodo,
    obtenerFlujoCajaNeto,
    obtenerEstadisticasPeriodo,
    obtenerRentabilidadPorPeriodo,
    calcularRentabilidadProducto,
  };
}

// Export instancia por defecto usando el repo real
const repo = require('../repositories/financiero.repository');
module.exports = crearServicioFinanciero(repo);
module.exports.crearServicioFinanciero = crearServicioFinanciero;
