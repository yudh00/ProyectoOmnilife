// =====================================================================
// CONTROLLER: productos.controller.js
// =====================================================================

const service = require('../services/productos.service');

function manejarError(res, err) {
  const status = err.status || 500;
  console.error('[ProductosController]', err.message);
  return res.status(status).json({ ok: false, error: err.message });
}

async function getProducto(req, res) {
  try {
    const idProducto = parseInt(req.params.id, 10);
    const producto = await service.obtenerProducto(idProducto);
    return res.json({ ok: true, data: producto });
  } catch (err) {
    return manejarError(res, err);
  }
}

async function postAgregarProducto(req, res) {
  try {
    const { nombre, descripcion, costoCompra, precioVenta, idEstado, cantidad, minimo, idCategoria } = req.body;
    const imagenRuta = req.file ? `/images/${req.file.filename}` : null;

    const resultado = await service.agregarProducto({
      nombre,
      descripcion,
      imagenRuta,
      costoCompra: parseFloat(costoCompra),
      precioVenta: parseFloat(precioVenta),
      idEstado: parseInt(idEstado, 10),
      cantidad: parseInt(cantidad ?? 0, 10),
      minimo: parseInt(minimo ?? 0, 10),
      idCategoria: idCategoria ? parseInt(idCategoria, 10) : null,
    });

    return res.status(201).json({ ok: true, data: resultado });
  } catch (err) {
    return manejarError(res, err);
  }
}

async function putEditarProducto(req, res) {
  try {
    const idProducto = parseInt(req.params.id, 10);
    const { nombre, descripcion, costoCompra, precioVenta, idEstado } = req.body;
    const imagenRuta = req.file ? `/images/${req.file.filename}` : undefined;

    const datos = {};
    if (nombre !== undefined)      datos.nombre = nombre;
    if (descripcion !== undefined) datos.descripcion = descripcion;
    if (imagenRuta !== undefined)  datos.imagenRuta = imagenRuta;
    if (costoCompra !== undefined) datos.costoCompra = parseFloat(costoCompra);
    if (precioVenta !== undefined) datos.precioVenta = parseFloat(precioVenta);
    if (idEstado !== undefined)    datos.idEstado = parseInt(idEstado, 10);

    const resultado = await service.editarProducto(idProducto, datos);
    return res.json({ ok: true, data: resultado });
  } catch (err) {
    return manejarError(res, err);
  }
}

async function deleteEliminarProducto(req, res) {
  try {
    const idProducto = parseInt(req.params.id, 10);
    const resultado = await service.eliminarProducto(idProducto);
    return res.json({ ok: true, data: resultado });
  } catch (err) {
    return manejarError(res, err);
  }
}

module.exports = { getProducto, postAgregarProducto, putEditarProducto, deleteEliminarProducto };
