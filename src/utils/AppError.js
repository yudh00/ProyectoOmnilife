// =====================================================================
// AppError.js — Clase de error de dominio con código HTTP
// Capa: utilidad compartida entre módulos
//
// SOLID — SRP: responsabilidad única de representar errores de aplicación.
// Patrón: Factory Methods estáticos para los casos más comunes.
// Permite que la capa de controller distinga errores de negocio
// (con .status) de errores inesperados (sin .status → 500).
// =====================================================================

class AppError extends Error {
  /**
   * @param {string} message  Mensaje legible para el cliente API.
   * @param {number} status   Código HTTP (400, 404, 409, 403…).
   * @param {string[]} [errores] Lista detallada (e.g. errores de validación).
   */
  constructor(message, status = 500, errores = null) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.errores = errores; // array opcional con mensajes individuales
  }

  // --- Factory methods para los casos más frecuentes ---

  /** 400 Bad Request */
  static badRequest(message, errores = null) {
    return new AppError(message, 400, errores);
  }

  /** 403 Forbidden — usado por RBAC cuando el módulo de seguridad esté listo */
  static forbidden(message = 'No tiene permisos para realizar esta acción') {
    return new AppError(message, 403);
  }

  /** 404 Not Found */
  static notFound(message) {
    return new AppError(message, 404);
  }

  /** 409 Conflict — duplicados, estado inválido, etc. */
  static conflict(message) {
    return new AppError(message, 409);
  }
}

module.exports = AppError;
