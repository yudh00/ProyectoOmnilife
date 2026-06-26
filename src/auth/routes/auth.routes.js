// =====================================================================
// ROUTES: auth.routes.js
// Endpoints REST para el inicio de sesión y validación de credenciales.
// =====================================================================

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/auth.controller');

// POST /api/auth/login -> Recibe { email, password }
router.post('/login', ctrl.login);

// POST /api/auth/register -> Recibe { nombre, apellidos, email, password }
router.post('/register', ctrl.register); 

module.exports = router;