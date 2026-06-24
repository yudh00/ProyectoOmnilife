// =====================================================================
// response.js — Helpers para respuestas JSON uniformes
// Capa: utilidad compartida entre módulos
//
// SOLID — DRY / SRP: centraliza el formato { ok, data } / { ok, error }
// que usa todo el proyecto, eliminando la función manejarError() local
// que se repite en cada controller.
// =====================================================================

/**
 * Respuesta de éxito (200 OK o el status indicado).
 * @param {import('express').Response} res
 * @param {*} data
 * @param {number} [status=200]
 */
function ok(res, data, status = 200) {
  return res.status(status).json({ ok: true, data });
}

/**
 * Respuesta de creación exitosa (201 Created).
 * @param {import('express').Response} res
 * @param {*} data
 */
function created(res, data) {
  return res.status(201).json({ ok: true, data });
}

/**
 * Respuesta de error. Lee err.status (puesto por AppError o el SP) y,
 * si está presente, incluye err.errores (array de mensajes de validación).
 * Loguea a consola solo errores internos (>= 500).
 * @param {import('express').Response} res
 * @param {Error} err
 */
function fail(res, err) {
  const status  = err.status  || 500;
  const message = err.message || 'Error interno del servidor';

  if (status >= 500) {
    console.error('[Error interno]', err);
  }

  const body = { ok: false, error: message };
  if (err.errores) body.errores = err.errores;

  return res.status(status).json(body);
}

module.exports = { ok, created, fail };
