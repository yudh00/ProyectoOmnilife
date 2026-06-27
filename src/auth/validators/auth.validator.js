// =====================================================================
// VALIDATOR: auth.validator.js
// Valida los datos de entrada del módulo de Autenticación (Login y Registro).
//
// SOLID — SRP: aísla las reglas de formato de credenciales del flujo principal.
// =====================================================================

const AppError = require('../../utils/AppError');

// Reutilizamos la misma expresión regular de correo estándar que Clientes
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Exactamente 8 dígitos — mismo formato Costa Rica que usa Clientes
const PHONE_REGEX = /^\d{8}$/;

/**
 * Valida los campos requeridos para iniciar sesión.
 * Lanza AppError 400 si las entradas no son válidas.
 * @param {{ email: string, password: string }} datos
 * @throws {AppError}
 */
function validarLogin({ email, password }) {
  const errores = [];

  if (!email || !email.trim()) {
    errores.push('El correo electrónico es requerido');
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errores.push('El formato del correo electrónico es inválido');
  }

  if (!password || !password.trim()) {
    errores.push('La contraseña es requerida');
  }

  if (errores.length > 0) {
    throw AppError.badRequest(errores.join('; '), errores);
  }
}

/**
 * Valida los campos requeridos para el registro de un nuevo Cliente.
 * Asegura la longitud mínima de contraseña y campos obligatorios.
 * @param {{ nombre: string, apellidos: string, email: string, password: string, telefono: string }} datos
 * @throws {AppError}
 */
function validarRegistro({ nombre, apellidos, email, password, telefono }) {
  const errores = [];

  if (!nombre || !nombre.trim()) {
    errores.push('El nombre es requerido');
  }

  if (!apellidos || !apellidos.trim()) {
    errores.push('Los apellidos son requeridos');
  }

  if (!email || !email.trim()) {
    errores.push('El correo electrónico es requerido');
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errores.push('El formato del correo electrónico es inválido');
  }

  if (!password || !password.trim()) {
    errores.push('La contraseña es requerida');
  } else if (password.trim().length < 6) {
    errores.push('La contraseña debe tener al menos 6 caracteres');
  }

  if (!telefono || !telefono.trim()) {
    errores.push('El teléfono es requerido');
  } else if (!PHONE_REGEX.test(telefono.trim())) {
    errores.push('El teléfono debe tener exactamente 8 dígitos');
  }

  if (errores.length > 0) {
    throw AppError.badRequest(errores.join('; '), errores);
  }
}

module.exports = {
  validarLogin,
  validarRegistro,
};