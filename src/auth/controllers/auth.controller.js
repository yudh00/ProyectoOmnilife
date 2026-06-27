// =====================================================================
// CONTROLLER: auth.controller.js
// Capa HTTP. Recibe credenciales de la GUI, llama al service y responde.
// =====================================================================

const service = require('../services/auth.service');
const { ok, fail } = require('../../utils/response');

async function login(req, res) {
  try {
    // La GUI envía camelCase inglés: { email, password }
    const { email, password } = req.body;
    
    const userAuthData = await service.autenticarUsuario(email, password);
    
    // Retorna el DTO AuthUser directo al cliente HTTP usando tus helpers
    return ok(res, userAuthData);
  } catch (err) {
    return fail(res, err);
  }
}

/**
 * Recibe los datos del formulario de registro de la GUI,
 * invoca al servicio de creación y retorna la sesión iniciada del Cliente.
 */
async function register(req, res) {
  try {
    // La GUI envía los datos del nuevo cliente: { nombre, apellidos, email, password, telefono }
    const { nombre, apellidos, email, password, telefono } = req.body;

    // Validación básica en capa HTTP para asegurar la integridad de la petición
    if (!nombre || !apellidos || !email || !password || !telefono) {
      return fail(res, { message: 'Todos los campos son requeridos', status: 400 });
    }

    const newUserAuthData = await service.registerClient({ nombre, apellidos, email, password, telefono });

    // Retorna el DTO AuthUser con estatus de éxito
    return ok(res, newUserAuthData);
  } catch (err) {
    return fail(res, err);
  }
}

module.exports = {
  login,
  register, // <-- Exportado bajo el mismo estándar
};