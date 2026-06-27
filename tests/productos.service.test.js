// =====================================================================
// PRUEBAS UNITARIAS: productos.service.js
// =====================================================================

jest.mock('../src/productos/repositories/productos.repository');

const repo = require('../src/productos/repositories/productos.repository');
const service = require('../src/productos/services/productos.service');

beforeEach(() => jest.clearAllMocks());

// =====================================================================
// obtenerProducto
// =====================================================================

describe('obtenerProducto', () => {
  test('lanza error 400 si no se pasa idProducto', async () => {
    const err = await service.obtenerProducto(null).catch((e) => e);
    expect(err.status).toBe(400);
  });

  test('lanza error 404 si el producto no existe', async () => {
    repo.obtenerProductoCompleto.mockResolvedValue(null);
    const err = await service.obtenerProducto(99).catch((e) => e);
    expect(err.status).toBe(404);
  });

  test('retorna el producto cuando existe', async () => {
    const producto = { idproducto: 1, nombreproducto: 'Omega 3', precioventaproducto: '25.00' };
    repo.obtenerProductoCompleto.mockResolvedValue(producto);
    const resultado = await service.obtenerProducto(1);
    expect(resultado).toEqual(producto);
  });
});

// =====================================================================
// agregarProducto
// =====================================================================

describe('agregarProducto', () => {
  const datosValidos = { nombre: 'Omega 3', costoCompra: 15, precioVenta: 25, idEstado: 1 };

  test('lanza error 400 si el nombre está vacío', async () => {
    const err = await service.agregarProducto({ ...datosValidos, nombre: '   ' }).catch((e) => e);
    expect(err.status).toBe(400);
    expect(err.message).toContain('nombre');
  });

  test('lanza error 400 si el costo de compra es cero o negativo', async () => {
    const err1 = await service.agregarProducto({ ...datosValidos, costoCompra: 0 }).catch((e) => e);
    const err2 = await service.agregarProducto({ ...datosValidos, costoCompra: -5 }).catch((e) => e);
    expect(err1.status).toBe(400);
    expect(err2.status).toBe(400);
  });

  test('lanza error 400 si el precio de venta es cero o negativo', async () => {
    const err = await service.agregarProducto({ ...datosValidos, precioVenta: 0 }).catch((e) => e);
    expect(err.status).toBe(400);
    expect(err.message).toContain('precio de venta');
  });

  test('lanza error 400 si falta el idEstado', async () => {
    const err = await service.agregarProducto({ ...datosValidos, idEstado: null }).catch((e) => e);
    expect(err.status).toBe(400);
  });

  test('retorna el ID del producto y mensaje de éxito al crearse correctamente', async () => {
    repo.crearProducto.mockResolvedValue(5);
    const resultado = await service.agregarProducto(datosValidos);
    expect(resultado.idProducto).toBe(5);
    expect(resultado.mensaje).toContain('creado');
  });
});

// =====================================================================
// editarProducto
// =====================================================================

describe('editarProducto', () => {
  test('lanza error 400 si no se pasa idProducto', async () => {
    const err = await service.editarProducto(null, { nombre: 'X' }).catch((e) => e);
    expect(err.status).toBe(400);
  });

  test('lanza error 404 si el producto no existe', async () => {
    repo.actualizarProducto.mockResolvedValue(null);
    const err = await service.editarProducto(99, { nombre: 'X' }).catch((e) => e);
    expect(err.status).toBe(404);
  });

  test('retorna el producto actualizado cuando existe', async () => {
    const actualizado = { idproducto: 1, nombreproducto: 'Omega 3 Plus' };
    repo.actualizarProducto.mockResolvedValue(actualizado);
    const resultado = await service.editarProducto(1, { nombre: 'Omega 3 Plus' });
    expect(resultado.nombreproducto).toBe('Omega 3 Plus');
  });
});

// =====================================================================
// eliminarProducto
// =====================================================================

describe('eliminarProducto', () => {
  test('lanza error 400 si no se pasa idProducto', async () => {
    const err = await service.eliminarProducto(null).catch((e) => e);
    expect(err.status).toBe(400);
  });

  test('lanza error 404 si el producto no existe', async () => {
    repo.eliminarProducto.mockResolvedValue(null);
    const err = await service.eliminarProducto(99).catch((e) => e);
    expect(err.status).toBe(404);
  });

  test('retorna mensaje de éxito al eliminar', async () => {
    repo.eliminarProducto.mockResolvedValue(true);
    const resultado = await service.eliminarProducto(1);
    expect(resultado.mensaje).toContain('eliminado');
  });
});
