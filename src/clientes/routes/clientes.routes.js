// =====================================================================
// ROUTES: clientes.routes.js
// Define los endpoints REST del Módulo de Gestión de Clientes.
//
// TODO autenticación — cuando el Módulo de Seguridad esté listo,
// descomentar las líneas de middleware y eliminar este bloque TODO:
//
//   const { requireJWT, requireRol } = require('../../middlewares/auth');
//   router.use(requireJWT);                          // valida JWT en todas las rutas
//   router.use(requireRol('Administrador'));          // solo admin puede listar/crear/editar
//   // Excepción: el propio cliente puede ver su historial (regla 3.5.3)
//   // → el service verificará req.user.idCliente === idCliente || rol === 'Administrador'
// =====================================================================

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/clientes.controller');

// ---------------------------------------------------------------------
// LISTADO / BÚSQUEDA
// GET /api/clientes                    → todos los clientes
// GET /api/clientes?busqueda=Juan      → búsqueda parcial por nombre, correo o teléfono
// ---------------------------------------------------------------------
router.get('/', ctrl.getClientes);

// ---------------------------------------------------------------------
// DETALLE
// GET /api/clientes/:id
// ---------------------------------------------------------------------
router.get('/:id', ctrl.getCliente);

// ---------------------------------------------------------------------
// HISTORIAL TRANSACCIONAL
// GET /api/clientes/:id/historial
// Ordenado más reciente primero (RF-06). Debe ir ANTES de /:id para
// que Express no interprete "historial" como un :id numérico.
// ---------------------------------------------------------------------
router.get('/:id/historial', ctrl.getHistorial);

// ---------------------------------------------------------------------
// CREAR
// POST /api/clientes
// Body: { firstName, lastName, email, phone }
// ---------------------------------------------------------------------
router.post('/', ctrl.postCliente);

// ---------------------------------------------------------------------
// ACTUALIZAR
// PUT /api/clientes/:id
// Body: { firstName, lastName, email, phone, isActive }
// ---------------------------------------------------------------------
router.put('/:id', ctrl.putCliente);

// ---------------------------------------------------------------------
// DESACTIVAR (soft delete — borrado lógico)
// DELETE /api/clientes/:id
// No borra el registro; preserva el historial (RF-05).
// ---------------------------------------------------------------------
router.delete('/:id', ctrl.deleteCliente);

module.exports = router;
