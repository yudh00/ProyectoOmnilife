// =====================================================================
// PRUEBAS UNITARIAS: ventas.service.js
// Modulo de Catalogo y Pedidos
// =====================================================================

jest.mock('../src/ventas/repositories/ventas.repository');
jest.mock('../src/utils/email.service');

const repo = require('../src/ventas/repositories/ventas.repository');
const emailService = require('../src/utils/email.service');
const service = require('../src/ventas/services/ventas.service');

beforeEach(() => {
  jest.clearAllMocks();
});

// =====================================================================
// CATALOGO
// =====================================================================

describe('listarCatalogo', () => {
  test('llama al repositorio sin filtros cuando no se pasan parametros', async () => {
    repo.obtenerCatalogo.mockResolvedValue([]);
    await service.listarCatalogo();
    expect(repo.obtenerCatalogo).toHaveBeenCalledWith(null, null);
  });

  test('llama al repositorio con filtros cuando se pasan', async () => {
    repo.obtenerCatalogo.mockResolvedValue([{ idproducto: 1 }]);
    const resultado = await service.listarCatalogo({ idCategoria: 2, busqueda: 'vitamina' });
    expect(repo.obtenerCatalogo).toHaveBeenCalledWith(2, 'vitamina');
    expect(resultado).toHaveLength(1);
  });

  test('lanza error si idCategoria no es un numero', async () => {
    await expect(service.listarCatalogo({ idCategoria: 'abc' })).rejects.toThrow(
      'El id de categoria debe ser un numero entero'
    );
    expect(repo.obtenerCatalogo).not.toHaveBeenCalled();
  });
});

describe('listarCategorias', () => {
  test('retorna las categorias del repositorio', async () => {
    const categorias = [{ idcategoria: 1, nombrecategoria: 'Vitaminas' }];
    repo.obtenerCategorias.mockResolvedValue(categorias);
    const resultado = await service.listarCategorias();
    expect(resultado).toEqual(categorias);
  });
});

describe('obtenerProducto', () => {
  test('lanza error si idProducto es invalido', async () => {
    await expect(service.obtenerProducto(null)).rejects.toThrow('Id de producto invalido');
    await expect(service.obtenerProducto('abc')).rejects.toThrow('Id de producto invalido');
  });

  test('lanza error 404 si el producto no existe', async () => {
    repo.obtenerProductoPorId.mockResolvedValue(null);
    const err = await service.obtenerProducto(99).catch((e) => e);
    expect(err.message).toBe('Producto no encontrado');
    expect(err.status).toBe(404);
  });

  test('retorna el producto cuando existe', async () => {
    const producto = { idproducto: 1, nombreproducto: 'Omega 3' };
    repo.obtenerProductoPorId.mockResolvedValue(producto);
    const resultado = await service.obtenerProducto(1);
    expect(resultado).toEqual(producto);
  });
});

// =====================================================================
// CARRITO
// =====================================================================

describe('verCarrito', () => {
  test('lanza error si no se proporciona idCliente', async () => {
    await expect(service.verCarrito(null)).rejects.toThrow('Id de cliente requerido');
  });

  test('retorna carrito con subtotal calculado', async () => {
    repo.obtenerCarrito.mockResolvedValue([
      { subtotallinea: '15.00' },
      { subtotallinea: '25.50' },
    ]);
    const resultado = await service.verCarrito(1);
    expect(resultado.subtotal).toBe('40.50');
    expect(resultado.cantidadItems).toBe(2);
  });

  test('retorna carrito vacio si no hay items', async () => {
    repo.obtenerCarrito.mockResolvedValue([]);
    const resultado = await service.verCarrito(1);
    expect(resultado.subtotal).toBe('0.00');
    expect(resultado.cantidadItems).toBe(0);
  });
});

describe('agregarAlCarrito', () => {
  test('lanza error si falta idCliente o idProducto', async () => {
    await expect(service.agregarAlCarrito(null, 1, 2)).rejects.toThrow(
      'Cliente y producto son requeridos'
    );
    await expect(service.agregarAlCarrito(1, null, 2)).rejects.toThrow(
      'Cliente y producto son requeridos'
    );
  });

  test('lanza error si la cantidad es cero o negativa', async () => {
    await expect(service.agregarAlCarrito(1, 1, 0)).rejects.toThrow(
      'La cantidad debe ser mayor a cero'
    );
    await expect(service.agregarAlCarrito(1, 1, -3)).rejects.toThrow(
      'La cantidad debe ser mayor a cero'
    );
  });

  test('lanza error 409 si el repositorio informa stock insuficiente', async () => {
    repo.agregarACarrito.mockRejectedValue(new Error('Stock insuficiente (disponible: 2)'));
    const err = await service.agregarAlCarrito(1, 1, 5).catch((e) => e);
    expect(err.status).toBe(409);
    expect(err.message).toContain('Stock insuficiente');
  });

  test('retorna resultado cuando el producto se agrega correctamente', async () => {
    repo.agregarACarrito.mockResolvedValue({ idcarrito: 1, mensaje: 'Producto agregado al carrito' });
    const resultado = await service.agregarAlCarrito(1, 2, 3);
    expect(resultado.idcarrito).toBe(1);
  });
});

describe('quitarDelCarrito', () => {
  test('lanza error si falta idCarrito o idProducto', async () => {
    await expect(service.quitarDelCarrito(null, 1)).rejects.toThrow(
      'Carrito y producto son requeridos'
    );
    await expect(service.quitarDelCarrito(1, null)).rejects.toThrow(
      'Carrito y producto son requeridos'
    );
  });

  test('lanza error 404 si el producto no estaba en el carrito', async () => {
    repo.eliminarProductoCarrito.mockResolvedValue(false);
    const err = await service.quitarDelCarrito(1, 99).catch((e) => e);
    expect(err.status).toBe(404);
    expect(err.message).toBe('No se encontro el producto en el carrito');
  });

  test('retorna mensaje de exito al eliminar correctamente', async () => {
    repo.eliminarProductoCarrito.mockResolvedValue(true);
    const resultado = await service.quitarDelCarrito(1, 2);
    expect(resultado.mensaje).toBe('Producto eliminado del carrito');
  });
});

// =====================================================================
// PEDIDOS
// =====================================================================

describe('confirmarPedido', () => {
  test('lanza error si falta idCliente o idCarrito', async () => {
    await expect(service.confirmarPedido(null, 1)).rejects.toThrow(
      'Cliente y carrito son requeridos'
    );
    await expect(service.confirmarPedido(1, null)).rejects.toThrow(
      'Cliente y carrito son requeridos'
    );
  });

  test('lanza error 409 si el carrito esta vacio', async () => {
    repo.crearPedido.mockRejectedValue(new Error('El carrito esta vacio'));
    const err = await service.confirmarPedido(1, 1).catch((e) => e);
    expect(err.status).toBe(409);
    expect(err.message).toContain('carrito esta vacio');
  });

  test('lanza error 409 si hay stock insuficiente al confirmar', async () => {
    repo.crearPedido.mockRejectedValue(new Error('Stock insuficiente para el producto: Omega 3'));
    const err = await service.confirmarPedido(1, 1).catch((e) => e);
    expect(err.status).toBe(409);
    expect(err.message).toContain('Stock insuficiente');
  });

  test('retorna el pedido formateado al confirmar exitosamente', async () => {
    repo.crearPedido.mockResolvedValue({
      idpedidogenerado: 5,
      numeropedido: 'PED-2026-000005',
      subtotal: '100.00',
      impuestos: '13.00',
      total: '113.00',
      mensaje: 'Pedido creado exitosamente',
    });
    repo.obtenerDatosCorreoPedido.mockResolvedValue([]);
    repo.obtenerAdminPrincipal.mockResolvedValue(null);

    const resultado = await service.confirmarPedido(1, 1);
    expect(resultado.idPedido).toBe(5);
    expect(resultado.numeroPedido).toBe('PED-2026-000005');
    expect(resultado.total).toBe(113);
    expect(resultado.subtotal).toBe(100);
    expect(resultado.impuestos).toBe(13);
  });
});

describe('listarPedidosDeCliente', () => {
  test('lanza error si no se proporciona idCliente', async () => {
    await expect(service.listarPedidosDeCliente(null)).rejects.toThrow('Id de cliente requerido');
  });

  test('retorna la lista de pedidos del cliente', async () => {
    const pedidos = [{ idpedido: 1 }, { idpedido: 2 }];
    repo.listarPedidosCliente.mockResolvedValue(pedidos);
    const resultado = await service.listarPedidosDeCliente(1);
    expect(resultado).toHaveLength(2);
  });
});

describe('verDetallePedido', () => {
  test('lanza error si no se proporciona idPedido', async () => {
    await expect(service.verDetallePedido(null)).rejects.toThrow('Id de pedido requerido');
  });

  test('lanza error 404 si el pedido no existe', async () => {
    repo.obtenerDetallePedido.mockResolvedValue([]);
    const err = await service.verDetallePedido(999).catch((e) => e);
    expect(err.status).toBe(404);
    expect(err.message).toBe('Pedido no encontrado');
  });

  test('retorna el detalle del pedido correctamente formateado', async () => {
    const filas = [
      {
        idpedido: 3,
        numeropedido: 'PED-2026-000003',
        fechapedido: '2026-06-01',
        estado: 'Pendiente',
        subtotal: '50.00',
        impuestos: '6.50',
        total: '56.50',
        idproducto: 1,
        nombreproducto: 'Omega 3',
        cantidad: 2,
        preciocongelado: '25.00',
        subtotallinea: '50.00',
      },
    ];
    repo.obtenerDetallePedido.mockResolvedValue(filas);

    const resultado = await service.verDetallePedido(3);
    expect(resultado.idPedido).toBe(3);
    expect(resultado.estado).toBe('Pendiente');
    expect(resultado.total).toBe(56.5);
    expect(resultado.lineas).toHaveLength(1);
    expect(resultado.lineas[0].nombreProducto).toBe('Omega 3');
    expect(resultado.lineas[0].cantidad).toBe(2);
  });
});

describe('cambiarEstadoPedido', () => {
  test('lanza error si falta idPedido o nuevoIdEstado', async () => {
    await expect(service.cambiarEstadoPedido(null, 2)).rejects.toThrow(
      'Pedido y nuevo estado son requeridos'
    );
    await expect(service.cambiarEstadoPedido(1, null)).rejects.toThrow(
      'Pedido y nuevo estado son requeridos'
    );
  });

  test('lanza error 400 si la transicion de estado es invalida', async () => {
    repo.actualizarEstadoPedido.mockResolvedValue({
      resultado: false,
      mensaje: 'Transicion invalida: Enviado -> Pendiente',
    });
    const err = await service.cambiarEstadoPedido(1, 5).catch((e) => e);
    expect(err.status).toBe(400);
    expect(err.message).toContain('Transicion invalida');
  });

  test('retorna resultado exitoso cuando la transicion es valida', async () => {
    repo.actualizarEstadoPedido.mockResolvedValue({
      resultado: true,
      mensaje: 'Estado actualizado de Pendiente a Pagado',
    });
    const resultado = await service.cambiarEstadoPedido(1, 2);
    expect(resultado.resultado).toBe(true);
    expect(resultado.mensaje).toContain('Pagado');
  });
});
