// VALIDATOR: clientes.validator.js
// Valida los datos de entrada del módulo de Clientes.
//
// SOLID — SRP: la validación es una responsabilidad aislada; ni el
// service ni el controller tienen que conocer las reglas de formato.
// Esto también facilita el testing unitario de las reglas de negocio
// RF-04 / Reglas 3.5 de la ERS.

const AppError = require('../../utils/AppError');

// Regex de correo estándar (nombre@dominio.tld) — RF-04
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Exactamente 8 dígitos — formato Costa Rica (RF-04, regla 3.5)
const PHONE_REGEX = /^\d{8}$/;

/**
 * Valida los campos requeridos de un cliente (create y update completo).
 * Lanza AppError 400 con la lista de errores de validación si algo falla.
 *
 * @param {{ nombre: string, apellidos: string, correo: string, telefono: string }} datos
 * @throws {AppError}
 */
function validarCliente({ nombre, apellidos, correo, telefono }) {
  const errores = [];

  if (!nombre || !nombre.trim()) {
    errores.push('El nombre es requerido');
  }

  if (!apellidos || !apellidos.trim()) {
    errores.push('Los apellidos son requeridos');
  }

  if (!correo || !correo.trim()) {
    errores.push('El correo electrónico es requerido');
  } else if (!EMAIL_REGEX.test(correo.trim())) {
    errores.push('El correo electrónico debe tener el formato nombre@dominio.com');
  }

  if (!telefono || !telefono.trim()) {
    errores.push('El teléfono es requerido');
  } else if (!PHONE_REGEX.test(telefono.trim())) {
    errores.push('El teléfono debe tener exactamente 8 dígitos (formato Costa Rica)');
  }

  if (errores.length > 0) {
    // Pasa el array completo para que el cliente API reciba cada error por separado
    throw AppError.badRequest(errores.join('; '), errores);
  }
}

module.exports = { validarCliente };
