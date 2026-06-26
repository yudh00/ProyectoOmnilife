// =====================================================================
// SERVICE: productos.service.js
// =====================================================================

const repo = require('../repositories/productos.repository');

async function agregarProducto(datos) {
  const { nombre, costoCompra, precioVenta, idEstado } = datos;

  if (!nombre?.trim())          throw Object.assign(new Error('El nombre del producto es requerido'), { status: 400 });
  if (!costoCompra || costoCompra <= 0) throw Object.assign(new Error('El costo de compra debe ser mayor a cero'), { status: 400 });
  if (!precioVenta || precioVenta <= 0) throw Object.assign(new Error('El precio de venta debe ser mayor a cero'), { status: 400 });
  if (!idEstado)                throw Object.assign(new Error('El estado del producto es requerido'), { status: 400 });

  const idProducto = await repo.crearProducto(datos);
  return { idProducto, mensaje: 'Producto creado correctamente' };
}

async function editarProducto(idProducto, datos) {
  if (!idProducto) throw Object.assign(new Error('Id de producto requerido'), { status: 400 });

  const resultado = await repo.actualizarProducto(idProducto, datos);
  if (!resultado) throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
  return resultado;
}

async function eliminarProducto(idProducto) {
  if (!idProducto) throw Object.assign(new Error('Id de producto requerido'), { status: 400 });

  const eliminado = await repo.eliminarProducto(idProducto);
  if (!eliminado) throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
  return { mensaje: 'Producto eliminado correctamente' };
}

module.exports = { agregarProducto, editarProducto, eliminarProducto };
