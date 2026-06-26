// =====================================================================
// REPOSITORY: productos.repository.js
// =====================================================================

const db = require('../../config/db');

async function obtenerProductoCompleto(idProducto) {
  const { rows } = await db.query(
    `SELECT p.IdProducto, p.NombreProducto, p.DescripcionProducto, p.ImagenProducto,
            p.CostoCompraProducto, p.PrecioVentaProducto, p.EstadoProducto,
            i.CantidadInventarioProducto, i.InventarioMinimoProducto,
            cp.IdCategoria
     FROM Producto p
     LEFT JOIN Inventario i ON i.IdProducto = p.IdProducto
     LEFT JOIN Categoria_Producto cp ON cp.IdProducto = p.IdProducto
     WHERE p.IdProducto = $1
     LIMIT 1`,
    [idProducto]
  );
  return rows[0] || null;
}

async function crearProducto({ nombre, descripcion, imagenRuta, costoCompra, precioVenta, idEstado, cantidad, minimo, idCategoria }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO Producto (NombreProducto, DescripcionProducto, ImagenProducto, CostoCompraProducto, PrecioVentaProducto, EstadoProducto)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING IdProducto`,
      [nombre, descripcion || null, imagenRuta || null, costoCompra, precioVenta, idEstado]
    );
    const idProducto = rows[0].idproducto;

    await client.query(
      `INSERT INTO Inventario (IdProducto, CantidadInventarioProducto, InventarioMinimoProducto)
       VALUES ($1, $2, $3)`,
      [idProducto, cantidad ?? 0, minimo ?? 0]
    );

    if (idCategoria) {
      await client.query(
        `INSERT INTO Categoria_Producto (IdProducto, IdCategoria) VALUES ($1, $2)`,
        [idProducto, idCategoria]
      );
    }

    await client.query('COMMIT');
    return idProducto;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function actualizarProducto(idProducto, { nombre, descripcion, imagenRuta, costoCompra, precioVenta, idEstado, cantidad, minimo }) {
  const campos = [];
  const valores = [];
  let i = 1;

  if (nombre !== undefined)      { campos.push(`NombreProducto = $${i++}`);       valores.push(nombre); }
  if (descripcion !== undefined) { campos.push(`DescripcionProducto = $${i++}`);  valores.push(descripcion); }
  if (imagenRuta !== undefined)  { campos.push(`ImagenProducto = $${i++}`);       valores.push(imagenRuta); }
  if (costoCompra !== undefined) { campos.push(`CostoCompraProducto = $${i++}`);  valores.push(costoCompra); }
  if (precioVenta !== undefined) { campos.push(`PrecioVentaProducto = $${i++}`);  valores.push(precioVenta); }
  if (idEstado !== undefined)    { campos.push(`EstadoProducto = $${i++}`);       valores.push(idEstado); }

  if (campos.length) {
    valores.push(idProducto);
    const { rowCount } = await db.query(
      `UPDATE Producto SET ${campos.join(', ')} WHERE IdProducto = $${i}`,
      valores
    );
    if (!rowCount) return null;
  }

  if (cantidad !== undefined || minimo !== undefined) {
    const invCampos = [];
    const invValores = [];
    let j = 1;
    if (cantidad !== undefined) { invCampos.push(`CantidadInventarioProducto = $${j++}`); invValores.push(cantidad); }
    if (minimo !== undefined)   { invCampos.push(`InventarioMinimoProducto = $${j++}`);   invValores.push(minimo); }
    invValores.push(idProducto);
    await db.query(
      `UPDATE Inventario SET ${invCampos.join(', ')} WHERE IdProducto = $${j}`,
      invValores
    );
  }

  return await obtenerProductoCompleto(idProducto);
}

async function eliminarProducto(idProducto) {
  const { rowCount } = await db.query(
    `DELETE FROM Producto WHERE IdProducto = $1`,
    [idProducto]
  );
  return rowCount > 0;
}

module.exports = { obtenerProductoCompleto, crearProducto, actualizarProducto, eliminarProducto };
