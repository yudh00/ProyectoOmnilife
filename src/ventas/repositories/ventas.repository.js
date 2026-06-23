// =====================================================================
// REPOSITORY: ventas.repository.js
// Capa de acceso a datos. Llama directamente a los Stored Procedures.
// No contiene logica de negocio, solo invocacion de SPs y mapeo de errores.
// =====================================================================

const db = require('../../config/db');

// ---------------------------------------------------------------------
// CATALOGO
// ---------------------------------------------------------------------

async function obtenerCatalogo(idCategoria, busqueda) {
  const sql = 'SELECT * FROM sp_obtener_catalogo($1, $2)';
  const { rows } = await db.query(sql, [idCategoria, busqueda]);
  return rows;
}

async function obtenerCategorias() {
  const sql = 'SELECT * FROM sp_obtener_categorias()';
  const { rows } = await db.query(sql);
  return rows;
}

async function obtenerProductoPorId(idProducto) {
  const sql = 'SELECT * FROM sp_obtener_producto_por_id($1)';
  const { rows } = await db.query(sql, [idProducto]);
  return rows[0] || null;
}

async function validarStock(idProducto, cantidad) {
  const sql = 'SELECT sp_validar_stock($1, $2) AS disponible';
  const { rows } = await db.query(sql, [idProducto, cantidad]);
  return rows[0].disponible;
}

// ---------------------------------------------------------------------
// CARRITO
// ---------------------------------------------------------------------

async function obtenerCarrito(idCliente) {
  const sql = 'SELECT * FROM sp_obtener_carrito($1)';
  const { rows } = await db.query(sql, [idCliente]);
  return rows;
}

async function agregarACarrito(idCliente, idProducto, cantidad) {
  const sql = 'SELECT * FROM sp_agregar_a_carrito($1, $2, $3)';
  const { rows } = await db.query(sql, [idCliente, idProducto, cantidad]);
  return rows[0];
}

async function eliminarProductoCarrito(idCarrito, idProducto) {
  const sql = 'SELECT sp_eliminar_producto_carrito($1, $2) AS eliminado';
  const { rows } = await db.query(sql, [idCarrito, idProducto]);
  return rows[0].eliminado;
}

// ---------------------------------------------------------------------
// PEDIDOS
// ---------------------------------------------------------------------

async function crearPedido(idCliente, idCarrito, impuestoPct = 13.00) {
  const sql = 'SELECT * FROM sp_crear_pedido($1, $2, $3)';
  const { rows } = await db.query(sql, [idCliente, idCarrito, impuestoPct]);
  return rows[0];
}

async function listarPedidosCliente(idCliente) {
  const sql = 'SELECT * FROM sp_listar_pedidos_cliente($1)';
  const { rows } = await db.query(sql, [idCliente]);
  return rows;
}

async function listarPedidosAdmin(idEstado = null) {
  const sql = 'SELECT * FROM sp_listar_pedidos_admin($1)';
  const { rows } = await db.query(sql, [idEstado]);
  return rows;
}

async function obtenerDetallePedido(idPedido) {
  const sql = 'SELECT * FROM sp_obtener_detalle_pedido($1)';
  const { rows } = await db.query(sql, [idPedido]);
  return rows;
}

async function actualizarEstadoPedido(idPedido, nuevoIdEstado) {
  const sql = 'SELECT * FROM sp_actualizar_estado_pedido($1, $2)';
  const { rows } = await db.query(sql, [idPedido, nuevoIdEstado]);
  return rows[0];
}

// ---------------------------------------------------------------------
// INVENTARIO
// ---------------------------------------------------------------------

async function obtenerProductosStockBajo() {
  const sql = 'SELECT * FROM sp_obtener_productos_stock_bajo()';
  const { rows } = await db.query(sql);
  return rows;
}

module.exports = {
  // Catalogo
  obtenerCatalogo,
  obtenerCategorias,
  obtenerProductoPorId,
  validarStock,
  // Carrito
  obtenerCarrito,
  agregarACarrito,
  eliminarProductoCarrito,
  // Pedidos
  crearPedido,
  listarPedidosCliente,
  listarPedidosAdmin,
  obtenerDetallePedido,
  actualizarEstadoPedido,
  // Inventario
  obtenerProductosStockBajo,
};
