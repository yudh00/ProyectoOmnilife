// =====================================================================
// PRUEBAS UNITARIAS: clientes.service.js
// Usa el patrón factory para inyectar el repo mock (DIP).
// =====================================================================

const { crearServicioClientes } = require('../src/clientes/services/clientes.service');
const AppError = require('../src/utils/AppError');

// Datos de ejemplo reutilizables
const filaCliente = {
  idcliente: 1,
  nombreusuario: 'Juan',
  apellidosusuario: 'Pérez',
  correoelectronico: 'juan@test.com',
  telefonousuario: '88887777',
  fecharegistro: '2026-01-01',
  isactivo: true,
  totalpedidos: '3',
};

const datosValidos = {
  nombre: 'Juan',
  apellidos: 'Pérez',
  correo: 'juan@test.com',
  telefono: '88887777',
};

let repoMock;
let svc;

beforeEach(() => {
  repoMock = {
    listarClientes: jest.fn(),
    obtenerClientePorId: jest.fn(),
    crearCliente: jest.fn(),
    actualizarCliente: jest.fn(),
    desactivarCliente: jest.fn(),
    obtenerHistorialCliente: jest.fn(),
  };
  svc = crearServicioClientes(repoMock);
});

// =====================================================================
// listarClientes
// =====================================================================

describe('listarClientes', () => {
  test('llama al repo con null si no se pasa búsqueda', async () => {
    repoMock.listarClientes.mockResolvedValue([filaCliente]);
    await svc.listarClientes();
    expect(repoMock.listarClientes).toHaveBeenCalledWith(null);
  });

  test('normaliza string vacío a null', async () => {
    repoMock.listarClientes.mockResolvedValue([]);
    await svc.listarClientes('   ');
    expect(repoMock.listarClientes).toHaveBeenCalledWith(null);
  });

  test('pasa el término de búsqueda trimmeado', async () => {
    repoMock.listarClientes.mockResolvedValue([]);
    await svc.listarClientes('  juan  ');
    expect(repoMock.listarClientes).toHaveBeenCalledWith('juan');
  });

  test('mapea las filas al formato DTO del frontend', async () => {
    repoMock.listarClientes.mockResolvedValue([filaCliente]);
    const resultado = await svc.listarClientes();
    expect(resultado[0]).toMatchObject({
      id: 1,
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@test.com',
      isActive: true,
      totalTransactions: 3,
    });
  });
});

// =====================================================================
// obtenerCliente
// =====================================================================

describe('obtenerCliente', () => {
  test('lanza AppError 400 si el ID no es un número válido', async () => {
    await expect(svc.obtenerCliente('abc')).rejects.toMatchObject({ status: 400 });
    await expect(svc.obtenerCliente(0)).rejects.toMatchObject({ status: 400 });
    await expect(svc.obtenerCliente(-1)).rejects.toMatchObject({ status: 400 });
  });

  test('lanza AppError 404 si el cliente no existe', async () => {
    repoMock.obtenerClientePorId.mockResolvedValue(null);
    await expect(svc.obtenerCliente(99)).rejects.toMatchObject({ status: 404 });
  });

  test('retorna el cliente mapeado cuando existe', async () => {
    repoMock.obtenerClientePorId.mockResolvedValue(filaCliente);
    const resultado = await svc.obtenerCliente(1);
    expect(resultado.id).toBe(1);
    expect(resultado.firstName).toBe('Juan');
  });
});

// =====================================================================
// crearCliente
// =====================================================================

describe('crearCliente', () => {
  test('lanza AppError 400 si los datos son inválidos', async () => {
    await expect(svc.crearCliente({ nombre: '', apellidos: 'Pérez', correo: 'juan@test.com', telefono: '88887777' }))
      .rejects.toMatchObject({ status: 400 });
    await expect(svc.crearCliente({ nombre: 'Juan', apellidos: 'Pérez', correo: 'no-es-un-correo', telefono: '88887777' }))
      .rejects.toMatchObject({ status: 400 });
    await expect(svc.crearCliente({ nombre: 'Juan', apellidos: 'Pérez', correo: 'juan@test.com', telefono: '123' }))
      .rejects.toMatchObject({ status: 400 });
  });

  test('lanza AppError 409 si el correo ya está registrado (code 23505)', async () => {
    const dbError = new Error('duplicate key');
    dbError.code = '23505';
    repoMock.crearCliente.mockRejectedValue(dbError);
    await expect(svc.crearCliente(datosValidos)).rejects.toMatchObject({ status: 409 });
  });

  test('lanza AppError 409 si el repo lanza mensaje de ya registrado', async () => {
    repoMock.crearCliente.mockRejectedValue(new Error('ya está registrado'));
    await expect(svc.crearCliente(datosValidos)).rejects.toMatchObject({ status: 409 });
  });

  test('retorna el cliente mapeado al crearse correctamente', async () => {
    repoMock.crearCliente.mockResolvedValue(filaCliente);
    const resultado = await svc.crearCliente(datosValidos);
    expect(resultado.email).toBe('juan@test.com');
  });
});

// =====================================================================
// actualizarCliente
// =====================================================================

describe('actualizarCliente', () => {
  test('lanza AppError 400 si el ID es inválido', async () => {
    await expect(svc.actualizarCliente('abc', datosValidos)).rejects.toMatchObject({ status: 400 });
  });

  test('lanza AppError 404 si el cliente no existe', async () => {
    repoMock.obtenerClientePorId.mockResolvedValue(null);
    await expect(svc.actualizarCliente(99, datosValidos)).rejects.toMatchObject({ status: 404 });
  });

  test('lanza AppError 409 si el nuevo correo ya lo usa otro cliente', async () => {
    repoMock.obtenerClientePorId.mockResolvedValue(filaCliente);
    const dbError = new Error('duplicate key');
    dbError.code = '23505';
    repoMock.actualizarCliente.mockRejectedValue(dbError);
    await expect(svc.actualizarCliente(1, datosValidos)).rejects.toMatchObject({ status: 409 });
  });

  test('retorna cliente actualizado correctamente', async () => {
    repoMock.obtenerClientePorId.mockResolvedValue(filaCliente);
    repoMock.actualizarCliente.mockResolvedValue({ ...filaCliente, telefonousuario: '11112222' });
    const resultado = await svc.actualizarCliente(1, datosValidos);
    expect(resultado.phone).toBe('11112222');
  });
});

// =====================================================================
// desactivarCliente
// =====================================================================

describe('desactivarCliente', () => {
  test('lanza AppError 400 si el ID es inválido', async () => {
    await expect(svc.desactivarCliente(0)).rejects.toMatchObject({ status: 400 });
  });

  test('lanza AppError 404 si el cliente no existe', async () => {
    repoMock.obtenerClientePorId.mockResolvedValue(null);
    await expect(svc.desactivarCliente(99)).rejects.toMatchObject({ status: 404 });
  });

  test('retorna mensaje de éxito al desactivar', async () => {
    repoMock.obtenerClientePorId.mockResolvedValue(filaCliente);
    repoMock.desactivarCliente.mockResolvedValue();
    const resultado = await svc.desactivarCliente(1);
    expect(resultado.mensaje).toContain('desactivado');
  });
});

// =====================================================================
// obtenerHistorial
// =====================================================================

describe('obtenerHistorial', () => {
  test('lanza AppError 400 si el ID es inválido', async () => {
    await expect(svc.obtenerHistorial('xyz')).rejects.toMatchObject({ status: 400 });
  });

  test('lanza AppError 404 si el cliente no existe', async () => {
    repoMock.obtenerClientePorId.mockResolvedValue(null);
    await expect(svc.obtenerHistorial(99)).rejects.toMatchObject({ status: 404 });
  });

  test('retorna historial vacío si el cliente no tiene pedidos', async () => {
    repoMock.obtenerClientePorId.mockResolvedValue(filaCliente);
    repoMock.obtenerHistorialCliente.mockResolvedValue([]);
    const resultado = await svc.obtenerHistorial(1);
    expect(resultado).toEqual([]);
  });

  test('agrupa correctamente varias líneas del mismo pedido', async () => {
    repoMock.obtenerClientePorId.mockResolvedValue(filaCliente);
    repoMock.obtenerHistorialCliente.mockResolvedValue([
      { idpedido: 10, fechapedido: '2026-06-01', estadopedido: 'Entregado', total: '56.50', idproducto: 1, nombreproducto: 'Omega 3', cantidad: 2, preciocongelado: '20.00' },
      { idpedido: 10, fechapedido: '2026-06-01', estadopedido: 'Entregado', total: '56.50', idproducto: 2, nombreproducto: 'Vitamina C', cantidad: 1, preciocongelado: '16.50' },
    ]);
    const resultado = await svc.obtenerHistorial(1);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].items).toHaveLength(2);
    expect(resultado[0].total).toBe(56.50);
  });

  test('ordena los pedidos con el más reciente primero', async () => {
    repoMock.obtenerClientePorId.mockResolvedValue(filaCliente);
    repoMock.obtenerHistorialCliente.mockResolvedValue([
      { idpedido: 1, fechapedido: '2026-01-01', estadopedido: 'Entregado', total: '10.00', idproducto: null },
      { idpedido: 2, fechapedido: '2026-06-01', estadopedido: 'Pendiente', total: '20.00', idproducto: null },
    ]);
    const resultado = await svc.obtenerHistorial(1);
    expect(resultado[0].id).toBe(2);
    expect(resultado[1].id).toBe(1);
  });
});
