// =====================================================================
// ROUTES: financiero.routes.js
// Define endpoints REST para el módulo financiero.
// =====================================================================

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/financiero.controller');

// GET /api/financiero/ingresos?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
router.get('/ingresos', ctrl.getIngresosPeriodo);

// GET /api/financiero/gastos?fechaInicio=...&fechaFin=...
router.get('/gastos', ctrl.getGastosPeriodo);

// GET /api/financiero/flujo?fechaInicio=...&fechaFin=...
router.get('/flujo', ctrl.getFlujoCajaNeto);

// GET /api/financiero/estadisticas?fechaInicio=...&fechaFin=...
router.get('/estadisticas', ctrl.getEstadisticasPeriodo);

// GET /api/financiero/rentabilidad?fechaInicio=...&fechaFin=...
router.get('/rentabilidad', ctrl.getRentabilidadPeriodo);

// GET /api/financiero/producto/:idProducto/rentabilidad
router.get('/producto/:idProducto/rentabilidad', ctrl.getRentabilidadProducto);

module.exports = router;
