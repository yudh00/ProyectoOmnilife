// =====================================================================
// CONTROLLER: ventas.controller.js
// Capa de presentacion HTTP. Recibe req/res, llama al service y
// estructura la respuesta JSON. No contiene logica de negocio.
// =====================================================================

const service = require('../services/ventas.service');

function manejarError(res, err) {
  const status = err.status || 500;
  const mensaje = err.message || 'Error interno del servidor';
  console.error('[VentasController] Error:', mensaje);
  return res.status(status).json({ ok: false, error: mensaje });
}

// ---------------------------------------------------------------------
// CATALOGO
// ---------------------------------------------------------------------

async function getCatalogo(req, res) {
  try {
    const { idCategoria, busqueda } = req.query;
    const productos = await service.listarCatalogo({
      idCategoria: idCategoria ? parseInt(idCategoria, 10) : null,
      busqueda: busqueda || null,
    });
    return res.json({ ok: true, data: productos });
  } catch (err) {
    return manejarError(res, err);
  }
}

async function getCategorias(req, res) {
  try {
    const categorias = await service.listarCategorias();
    return res.json({ ok: true, data: categorias });
  } catch (err) {
    return manejarError(res, err);
  }
}

async function getProducto(req, res) {
  try {
    const producto = await service.obtenerProducto(parseInt(req.params.id, 10));
    return res.json({ ok: true, data: producto });
  } catch (err) {
    return manejarError(res, err);
  }
}

// ---------------------------------------------------------------------
// CARRITO
// ---------------------------------------------------------------------

async function getCarrito(req, res) {
  try {
    const idCliente = parseInt(req.params.idCliente, 10);
    const carrito = await service.verCarrito(idCliente);
    return res.json({ ok: true, data: carrito });
  } catch (err) {
    return manejarError(res, err);
  }
}

async function postAgregarAlCarrito(req, res) {
  try {
    const { idCliente, idProducto, cantidad } = req.body;
    const resultado = await service.agregarAlCarrito(idCliente, idProducto, cantidad);
    return res.status(201).json({ ok: true, data: resultado });
  } catch (err) {
    return manejarError(res, err);
  }
}

async function deleteProductoCarrito(req, res) {
  try {
    const idCarrito = parseInt(req.params.idCarrito, 10);
    const idProducto = parseInt(req.params.idProducto, 10);
    const resultado = await service.quitarDelCarrito(idCarrito, idProducto);
    return res.json({ ok: true, data: resultado });
  } catch (err) {
    return manejarError(res, err);
  }
}

// ---------------------------------------------------------------------
// PEDIDOS
// ---------------------------------------------------------------------

async function postConfirmarPedido(req, res) {
  try {
    const { idCliente, idCarrito, impuestoPct } = req.body;
    const pedido = await service.confirmarPedido(idCliente, idCarrito, impuestoPct);
    return res.status(201).json({ ok: true, data: pedido });
  } catch (err) {
    return manejarError(res, err);
  }
}

async function getPedidosCliente(req, res) {
  try {
    const idCliente = parseInt(req.params.idCliente, 10);
    const pedidos = await service.listarPedidosDeCliente(idCliente);
    return res.json({ ok: true, data: pedidos });
  } catch (err) {
    return manejarError(res, err);
  }
}

async function getPedidosAdmin(req, res) {
  try {
    const idEstado = req.query.idEstado ? parseInt(req.query.idEstado, 10) : null;
    const pedidos = await service.listarPedidosParaAdmin(idEstado);
    return res.json({ ok: true, data: pedidos });
  } catch (err) {
    return manejarError(res, err);
  }
}

async function getDetallePedido(req, res) {
  try {
    const idPedido = parseInt(req.params.idPedido, 10);
    const detalle = await service.verDetallePedido(idPedido);
    return res.json({ ok: true, data: detalle });
  } catch (err) {
    return manejarError(res, err);
  }
}

async function patchEstadoPedido(req, res) {
  try {
    const idPedido = parseInt(req.params.idPedido, 10);
    const { idEstado } = req.body;
    const resultado = await service.cambiarEstadoPedido(idPedido, idEstado);
    return res.json({ ok: true, data: resultado });
  } catch (err) {
    return manejarError(res, err);
  }
}

// ---------------------------------------------------------------------
// INVENTARIO
// ---------------------------------------------------------------------

async function getStockBajo(req, res) {
  try {
    const productos = await service.consultarStockBajo();
    return res.json({ ok: true, data: productos });
  } catch (err) {
    return manejarError(res, err);
  }
}

module.exports = {
  getCatalogo,
  getCategorias,
  getProducto,
  getCarrito,
  postAgregarAlCarrito,
  deleteProductoCarrito,
  postConfirmarPedido,
  getPedidosCliente,
  getPedidosAdmin,
  getDetallePedido,
  patchEstadoPedido,
  getStockBajo,
};
