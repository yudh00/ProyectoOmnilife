// =====================================================================
// SERVICE: ventas.service.js
// Capa de logica de negocio. Aplica reglas de dominio y validaciones
// antes de llamar al repositorio. Lanza errores con mensajes claros.
// =====================================================================

const repo = require('../repositories/ventas.repository');

// ---------------------------------------------------------------------
// CATALOGO
// ---------------------------------------------------------------------

async function listarCatalogo(filtros = {}) {
  const { idCategoria = null, busqueda = null } = filtros;

  if (idCategoria !== null && !Number.isInteger(Number(idCategoria))) {
    throw new Error('El id de categoria debe ser un numero entero');
  }

  return await repo.obtenerCatalogo(idCategoria, busqueda);
}

async function listarCategorias() {
  return await repo.obtenerCategorias();
}

async function obtenerProducto(idProducto) {
  if (!idProducto || !Number.isInteger(Number(idProducto))) {
    throw new Error('Id de producto invalido');
  }

  const producto = await repo.obtenerProductoPorId(idProducto);
  if (!producto) {
    const err = new Error('Producto no encontrado');
    err.status = 404;
    throw err;
  }
  return producto;
}

// ---------------------------------------------------------------------
// CARRITO
// ---------------------------------------------------------------------

async function verCarrito(idCliente) {
  if (!idCliente) throw new Error('Id de cliente requerido');
  const items = await repo.obtenerCarrito(idCliente);
  const subtotal = items.reduce((acc, it) => acc + parseFloat(it.subtotallinea), 0);
  return {
    items,
    subtotal: subtotal.toFixed(2),
    cantidadItems: items.length,
  };
}

async function agregarAlCarrito(idCliente, idProducto, cantidad) {
  if (!idCliente || !idProducto) throw new Error('Cliente y producto son requeridos');
  if (!cantidad || cantidad <= 0) throw new Error('La cantidad debe ser mayor a cero');

  try {
    return await repo.agregarACarrito(idCliente, idProducto, cantidad);
  } catch (err) {
    // Re-lanzar con mensaje del SP si es por stock
    if (err.message.includes('Stock insuficiente')) {
      const e = new Error(err.message);
      e.status = 409;
      throw e;
    }
    throw err;
  }
}

async function quitarDelCarrito(idCarrito, idProducto) {
  if (!idCarrito || !idProducto) throw new Error('Carrito y producto son requeridos');
  const eliminado = await repo.eliminarProductoCarrito(idCarrito, idProducto);
  if (!eliminado) {
    const err = new Error('No se encontro el producto en el carrito');
    err.status = 404;
    throw err;
  }
  return { mensaje: 'Producto eliminado del carrito' };
}

// ---------------------------------------------------------------------
// PEDIDOS
// ---------------------------------------------------------------------

async function confirmarPedido(idCliente, idCarrito, impuestoPct) {
  if (!idCliente || !idCarrito) throw new Error('Cliente y carrito son requeridos');

  try {
    const resultado = await repo.crearPedido(idCliente, idCarrito, impuestoPct);
    return {
      idPedido: resultado.idpedidogenerado,
      numeroPedido: resultado.numeropedido,
      subtotal: parseFloat(resultado.subtotal),
      impuestos: parseFloat(resultado.impuestos),
      total: parseFloat(resultado.total),
      mensaje: resultado.mensaje,
    };
  } catch (err) {
    // El SP lanza excepciones con RAISE EXCEPTION; las re-empaquetamos
    if (err.message.includes('Stock insuficiente') || err.message.includes('carrito esta vacio')) {
      const e = new Error(err.message);
      e.status = 409;
      throw e;
    }
    throw err;
  }
}

async function listarPedidosDeCliente(idCliente) {
  if (!idCliente) throw new Error('Id de cliente requerido');
  return await repo.listarPedidosCliente(idCliente);
}

async function listarPedidosParaAdmin(idEstado = null) {
  return await repo.listarPedidosAdmin(idEstado);
}

async function verDetallePedido(idPedido) {
  if (!idPedido) throw new Error('Id de pedido requerido');
  const filas = await repo.obtenerDetallePedido(idPedido);
  if (!filas.length) {
    const err = new Error('Pedido no encontrado');
    err.status = 404;
    throw err;
  }

  // Como el SP retorna filas por linea, agrupamos en cabecera + lineas
  const primera = filas[0];
  return {
    idPedido: primera.idpedido,
    numeroPedido: primera.numeropedido,
    fechaPedido: primera.fechapedido,
    estado: primera.estado,
    subtotal: parseFloat(primera.subtotal),
    impuestos: parseFloat(primera.impuestos),
    total: parseFloat(primera.total),
    lineas: filas.map((f) => ({
      idProducto: f.idproducto,
      nombreProducto: f.nombreproducto,
      cantidad: f.cantidad,
      precioCongelado: parseFloat(f.preciocongelado),
      subtotalLinea: parseFloat(f.subtotallinea),
    })),
  };
}

async function cambiarEstadoPedido(idPedido, nuevoIdEstado) {
  if (!idPedido || !nuevoIdEstado) throw new Error('Pedido y nuevo estado son requeridos');
  const resultado = await repo.actualizarEstadoPedido(idPedido, nuevoIdEstado);
  if (!resultado.resultado) {
    const err = new Error(resultado.mensaje);
    err.status = 400;
    throw err;
  }
  return resultado;
}

// ---------------------------------------------------------------------
// INVENTARIO
// ---------------------------------------------------------------------

async function consultarStockBajo() {
  return await repo.obtenerProductosStockBajo();
}

module.exports = {
  listarCatalogo,
  listarCategorias,
  obtenerProducto,
  verCarrito,
  agregarAlCarrito,
  quitarDelCarrito,
  confirmarPedido,
  listarPedidosDeCliente,
  listarPedidosParaAdmin,
  verDetallePedido,
  cambiarEstadoPedido,
  consultarStockBajo,
};
