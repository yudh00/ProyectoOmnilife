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

async function obtenerDatosCorreoPedido(idPedido) {
  const sql = `
    SELECT
      u.NombreUsuario    AS nombre_cliente,
      u.ApellidosUsuario AS apellidos_cliente,
      u.CorreoElectronico AS correo_cliente,
      lp.Cantidad        AS cantidad,
      lp.PrecioCongelado AS precio_unitario,
      prod.NombreProducto AS nombre_producto
    FROM Pedido p
    JOIN Cliente c   ON c.IdCliente = p.IdCliente
    JOIN Usuario u   ON u.IdUsuario = c.IdUsuario
    JOIN LineaDePedido lp ON lp.IdPedido = p.IdPedido
    JOIN Producto prod    ON prod.IdProducto = lp.IdProducto
    WHERE p.IdPedido = $1
    ORDER BY prod.NombreProducto
  `;
  const { rows } = await db.query(sql, [idPedido]);
  return rows;
}

async function obtenerAdminPrincipal() {
  const sql = `
    SELECT NombreUsuario, ApellidosUsuario, CorreoElectronico
    FROM Usuario
    WHERE IdRol = 1
    LIMIT 1
  `;
  const { rows } = await db.query(sql);
  return rows[0] || null;
}

// ---------------------------------------------------------------------
// INVENTARIO
// ---------------------------------------------------------------------

async function obtenerProductosStockBajo() {
  const sql = 'SELECT * FROM sp_obtener_productos_stock_bajo()';
  const { rows } = await db.query(sql);
  return rows;
}

// NUEVA FUNCION PARA ACTUALIZAR STOCK EN BD
async function actualizarStockProducto(idProducto, delta) {
  // Realizamos el UPDATE directamente con SQL puro.
  // La condición (Stock + $1) >= 0 asegura que no el stock no baje de cero.
  const sql = `
    UPDATE Inventario 
    SET CantidadInventarioProducto = CantidadInventarioProducto + $1 
    WHERE IdProducto = $2 
    AND (CantidadInventarioProducto + $1) >= 0
    RETURNING CantidadInventarioProducto;
  `;
  
  try {
    const { rowCount } = await db.query(sql, [delta, idProducto]);
    // Si rowCount es > 0, significa que se actualizó el registro exitosamente
    return rowCount > 0;
  } catch (err) {
    console.error("Error en BD al actualizar stock:", err);
    return false;
  }
}

async function obtenerEstadosPedido() {
  const { rows } = await db.query('SELECT IdEstado, Estado FROM Estado ORDER BY IdEstado');
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
  obtenerDatosCorreoPedido,
  obtenerAdminPrincipal,
  // Inventario
  obtenerProductosStockBajo,
  actualizarStockProducto,
  // Estados
  obtenerEstadosPedido,
};