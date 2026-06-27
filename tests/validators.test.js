// =====================================================================
// PRUEBAS UNITARIAS: clientes.validator.js y auth.validator.js
// Son funciones puras — no necesitan mocks.
// =====================================================================

const { validarCliente } = require('../src/clientes/validators/clientes.validator');
const { validarLogin, validarRegistro } = require('../src/auth/validators/auth.validator');

// =====================================================================
// clientes.validator — validarCliente
// =====================================================================

describe('validarCliente', () => {
  const datosValidos = { nombre: 'Juan', apellidos: 'Pérez', correo: 'juan@test.com', telefono: '88887777' };

  test('no lanza error con datos válidos', () => {
    expect(() => validarCliente(datosValidos)).not.toThrow();
  });

  test('lanza AppError 400 si el nombre está vacío', () => {
    expect(() => validarCliente({ ...datosValidos, nombre: '' })).toThrow();
    expect(() => validarCliente({ ...datosValidos, nombre: '   ' })).toThrow();
  });

  test('lanza AppError 400 si los apellidos están vacíos', () => {
    expect(() => validarCliente({ ...datosValidos, apellidos: '' })).toThrow();
  });

  test('lanza AppError 400 si el correo no tiene formato válido', () => {
    expect(() => validarCliente({ ...datosValidos, correo: 'sin-arroba' })).toThrow();
    expect(() => validarCliente({ ...datosValidos, correo: 'sin@dominio' })).toThrow();
    expect(() => validarCliente({ ...datosValidos, correo: '' })).toThrow();
  });

  test('lanza AppError 400 si el teléfono no tiene exactamente 8 dígitos', () => {
    expect(() => validarCliente({ ...datosValidos, telefono: '123' })).toThrow();
    expect(() => validarCliente({ ...datosValidos, telefono: '123456789' })).toThrow();
    expect(() => validarCliente({ ...datosValidos, telefono: 'abcdefgh' })).toThrow();
    expect(() => validarCliente({ ...datosValidos, telefono: '' })).toThrow();
  });

  test('el error lanzado tiene status 400', () => {
    try {
      validarCliente({ ...datosValidos, nombre: '' });
    } catch (err) {
      expect(err.status).toBe(400);
    }
  });

  test('acumula múltiples errores en una sola excepción', () => {
    try {
      validarCliente({ nombre: '', apellidos: '', correo: '', telefono: '' });
    } catch (err) {
      expect(err.errores.length).toBeGreaterThan(1);
    }
  });
});

// =====================================================================
// auth.validator — validarLogin
// =====================================================================

describe('validarLogin', () => {
  test('no lanza error con credenciales válidas', () => {
    expect(() => validarLogin({ email: 'admin@omni.com', password: 'pass123' })).not.toThrow();
  });

  test('lanza AppError 400 si el correo está vacío', () => {
    expect(() => validarLogin({ email: '', password: 'pass123' })).toThrow();
  });

  test('lanza AppError 400 si el correo tiene formato inválido', () => {
    expect(() => validarLogin({ email: 'no-es-correo', password: 'pass123' })).toThrow();
  });

  test('lanza AppError 400 si la contraseña está vacía', () => {
    expect(() => validarLogin({ email: 'admin@omni.com', password: '' })).toThrow();
    expect(() => validarLogin({ email: 'admin@omni.com', password: '   ' })).toThrow();
  });

  test('el error tiene status 400', () => {
    try {
      validarLogin({ email: '', password: '' });
    } catch (err) {
      expect(err.status).toBe(400);
    }
  });
});

// =====================================================================
// auth.validator — validarRegistro
// =====================================================================

describe('validarRegistro', () => {
  const datosValidos = { nombre: 'Ana', apellidos: 'Gómez', email: 'ana@test.com', password: 'pass123' };

  test('no lanza error con datos válidos', () => {
    expect(() => validarRegistro(datosValidos)).not.toThrow();
  });

  test('lanza AppError 400 si el nombre está vacío', () => {
    expect(() => validarRegistro({ ...datosValidos, nombre: '' })).toThrow();
  });

  test('lanza AppError 400 si los apellidos están vacíos', () => {
    expect(() => validarRegistro({ ...datosValidos, apellidos: '' })).toThrow();
  });

  test('lanza AppError 400 si el correo tiene formato inválido', () => {
    expect(() => validarRegistro({ ...datosValidos, email: 'correo-invalido' })).toThrow();
  });

  test('lanza AppError 400 si la contraseña tiene menos de 6 caracteres', () => {
    expect(() => validarRegistro({ ...datosValidos, password: '123' })).toThrow();
    expect(() => validarRegistro({ ...datosValidos, password: '12345' })).toThrow();
  });

  test('no lanza error si la contraseña tiene exactamente 6 caracteres', () => {
    expect(() => validarRegistro({ ...datosValidos, password: '123456' })).not.toThrow();
  });

  test('acumula múltiples errores en una sola excepción', () => {
    try {
      validarRegistro({ nombre: '', apellidos: '', email: '', password: '' });
    } catch (err) {
      expect(err.errores.length).toBeGreaterThan(1);
    }
  });
});
