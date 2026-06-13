// =====================================================================
// ROUTES: ventas.routes.js
// Define todos los endpoints REST del modulo Catalogo y Ventas.
// =====================================================================

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/ventas.controller');

// ---------------------------------------------------------------------
// CATALOGO (lectura publica)
// ---------------------------------------------------------------------
// GET /api/ventas/catalogo                     -> lista todos los productos
// GET /api/ventas/catalogo?idCategoria=2       -> filtra por categoria
// GET /api/ventas/catalogo?busqueda=magnus     -> busca por nombre
router.get('/catalogo', ctrl.getCatalogo);

// GET /api/ventas/categorias
router.get('/categorias', ctrl.getCategorias);

// GET /api/ventas/productos/:id
router.get('/productos/:id', ctrl.getProducto);

// ---------------------------------------------------------------------
// CARRITO
// ---------------------------------------------------------------------
// GET /api/ventas/carrito/:idCliente
router.get('/carrito/:idCliente', ctrl.getCarrito);

// POST /api/ventas/carrito
// body: { idCliente, idProducto, cantidad }
router.post('/carrito', ctrl.postAgregarAlCarrito);

// DELETE /api/ventas/carrito/:idCarrito/productos/:idProducto
router.delete('/carrito/:idCarrito/productos/:idProducto', ctrl.deleteProductoCarrito);

// ---------------------------------------------------------------------
// PEDIDOS
// ---------------------------------------------------------------------
// POST /api/ventas/pedidos
// body: { idCliente, idCarrito, impuestoPct? }
router.post('/pedidos', ctrl.postConfirmarPedido);

// GET /api/ventas/pedidos/cliente/:idCliente
router.get('/pedidos/cliente/:idCliente', ctrl.getPedidosCliente);

// GET /api/ventas/pedidos/admin?idEstado=4
router.get('/pedidos/admin', ctrl.getPedidosAdmin);

// GET /api/ventas/pedidos/:idPedido
router.get('/pedidos/:idPedido', ctrl.getDetallePedido);

// PATCH /api/ventas/pedidos/:idPedido/estado
// body: { idEstado }
router.patch('/pedidos/:idPedido/estado', ctrl.patchEstadoPedido);

// ---------------------------------------------------------------------
// INVENTARIO (admin)
// ---------------------------------------------------------------------
// GET /api/ventas/inventario/stock-bajo
router.get('/inventario/stock-bajo', ctrl.getStockBajo);

module.exports = router;
