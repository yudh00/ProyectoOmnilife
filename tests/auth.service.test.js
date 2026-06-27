// =====================================================================
// PRUEBAS UNITARIAS: auth.service.js
// Usa el patrón factory para inyectar el repo mock (DIP).
// Mockea bcrypt y jsonwebtoken para no depender de implementaciones externas.
// =====================================================================

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { crearServicioAuth } = require('../src/auth/services/auth.service');

const filaUsuario = {
  idusuario: 1,
  correoelectronico: 'admin@omni.com',
  nombreusuario: 'Dylan',
  apellidosusuario: 'Solano',
  idrol: 1,
  nombrerol: 'Administrador',
  idcliente: null,
  contrasena: '$2b$10$hashsecreto',
};

let repoMock;
let svc;

beforeEach(() => {
  repoMock = {
    buscarUsuarioPorCorreo: jest.fn(),
    crearUsuarioCliente: jest.fn(),
  };
  svc = crearServicioAuth(repoMock);
  jest.clearAllMocks();
});

// =====================================================================
// autenticarUsuario
// =====================================================================

describe('autenticarUsuario', () => {
  test('lanza AppError 400 si el correo tiene formato inválido', async () => {
    await expect(svc.autenticarUsuario('no-es-correo', 'pass123')).rejects.toMatchObject({ status: 400 });
  });

  test('lanza AppError 400 si la contraseña está vacía', async () => {
    await expect(svc.autenticarUsuario('admin@omni.com', '')).rejects.toMatchObject({ status: 400 });
  });

  test('lanza AppError 401 si el usuario no existe en la BD', async () => {
    repoMock.buscarUsuarioPorCorreo.mockResolvedValue(null);
    await expect(svc.autenticarUsuario('noexiste@test.com', 'pass123')).rejects.toMatchObject({ status: 401 });
  });

  test('lanza AppError 401 si la contraseña no coincide', async () => {
    repoMock.buscarUsuarioPorCorreo.mockResolvedValue(filaUsuario);
    bcrypt.compare.mockResolvedValue(false);
    await expect(svc.autenticarUsuario('admin@omni.com', 'wrongpass')).rejects.toMatchObject({ status: 401 });
  });

  test('retorna el DTO de usuario autenticado con token al tener credenciales válidas', async () => {
    repoMock.buscarUsuarioPorCorreo.mockResolvedValue(filaUsuario);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('token.firmado.jwt');

    const resultado = await svc.autenticarUsuario('admin@omni.com', 'admin123');

    expect(resultado.idUsuario).toBe(1);
    expect(resultado.correoElectronico).toBe('admin@omni.com');
    expect(resultado.nombreRol).toBe('Administrador');
    expect(resultado.token).toBe('token.firmado.jwt');
    expect(resultado.idCliente).toBeNull();
  });

  test('normaliza el correo a lowercase antes de buscarlo', async () => {
    repoMock.buscarUsuarioPorCorreo.mockResolvedValue(null);
    await svc.autenticarUsuario('ADMIN@OMNI.COM', 'pass123').catch(() => {});
    expect(repoMock.buscarUsuarioPorCorreo).toHaveBeenCalledWith('admin@omni.com');
  });
});

// =====================================================================
// registerClient
// =====================================================================

describe('registerClient', () => {
  test('lanza AppError 400 si el nombre está vacío', async () => {
    await expect(svc.registerClient({ nombre: '', apellidos: 'Gómez', email: 'x@x.com', password: 'pass123' }))
      .rejects.toMatchObject({ status: 400 });
  });

  test('lanza AppError 400 si el correo tiene formato inválido', async () => {
    await expect(svc.registerClient({ nombre: 'Ana', apellidos: 'Gómez', email: 'no-correo', password: 'pass123' }))
      .rejects.toMatchObject({ status: 400 });
  });

  test('lanza AppError 400 si la contraseña tiene menos de 6 caracteres', async () => {
    await expect(svc.registerClient({ nombre: 'Ana', apellidos: 'Gómez', email: 'ana@test.com', password: '123' }))
      .rejects.toMatchObject({ status: 400 });
  });

  test('lanza AppError 409 si el correo ya está registrado', async () => {
    repoMock.buscarUsuarioPorCorreo.mockResolvedValue(filaUsuario);
    await expect(svc.registerClient({ nombre: 'Ana', apellidos: 'Gómez', email: 'admin@omni.com', password: 'pass123' }))
      .rejects.toMatchObject({ status: 409 });
  });

  test('registra el cliente y retorna el DTO con token', async () => {
    repoMock.buscarUsuarioPorCorreo.mockResolvedValue(null);
    bcrypt.genSalt.mockResolvedValue('salt123');
    bcrypt.hash.mockResolvedValue('hashedpass');
    const nuevoUsuario = { ...filaUsuario, idusuario: 5, idrol: 2, nombrerol: 'Cliente', idcliente: 5 };
    repoMock.crearUsuarioCliente.mockResolvedValue(nuevoUsuario);
    jwt.sign.mockReturnValue('nuevo.token.jwt');

    const resultado = await svc.registerClient({
      nombre: 'Ana',
      apellidos: 'Gómez',
      email: 'ana@test.com',
      password: 'pass123',
    });

    expect(resultado.idUsuario).toBe(5);
    expect(resultado.token).toBe('nuevo.token.jwt');
    expect(resultado.idCliente).toBe(5);
    expect(repoMock.crearUsuarioCliente).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ana@test.com', contrasenaHash: 'hashedpass' })
    );
  });
});
