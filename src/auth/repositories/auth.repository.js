// =====================================================================
// REPOSITORY: auth.repository.js
// Capa de acceso a datos para autenticación utilizando SQL puro.
// =====================================================================

const db = require('../../config/db');

/**
 * Busca un usuario por su correo electrónico y une dinámicamente si es Admin o Cliente.
 */
async function buscarUsuarioPorCorreo(correo) {
  const queryText = `
    SELECT 
      u.IdUsuario,
      u.CorreoElectronico,
      u.NombreUsuario,
      u.ApellidosUsuario,
      u.Contrasena,
      u.IdRol,
      r.NombreRol
    FROM Usuario u
    INNER JOIN Rol r ON u.IdRol = r.IdRol
    WHERE u.CorreoElectronico = $1;
  `;
  
  const { rows } = await db.query(queryText, [correo]);
  return rows[0] || null;
}

/**
 * Inserta un nuevo usuario en la base de datos asignándole por defecto el IdRol = 2 (Cliente).
 * Devuelve los datos del nuevo usuario junto con el NombreRol gracias al INNER JOIN en la inserción.
 */
async function crearUsuarioCliente({ nombre, apellidos, email, contrasenaHash }) {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN'); // Iniciar transacción

    // 1. Insertar en tabla Usuario
    const queryUsuario = `
      INSERT INTO Usuario (NombreUsuario, ApellidosUsuario, CorreoElectronico, Contrasena, IdRol, FechaRegistro)
      VALUES ($1, $2, $3, $4, 2, CURRENT_DATE)
      RETURNING IdUsuario;
    `;
    const resUsuario = await client.query(queryUsuario, [nombre, apellidos, email, contrasenaHash]);
    const idUsuario = resUsuario.rows[0].idusuario;

    // 2. Insertar en tabla Cliente usando el ID generado
    const queryCliente = `
      INSERT INTO Cliente (IdUsuario, IsActivo, NotaAsesoria)
      VALUES ($1, TRUE, 'Nuevo cliente registrado desde la App');
    `;
    await client.query(queryCliente, [idUsuario]);

    await client.query('COMMIT'); // Guardar cambios

    // Retornamos el usuario creado
    return { id: idUsuario, nombre, apellidos, email }; 

  } catch (error) {
    await client.query('ROLLBACK'); // Deshacer si algo falla
    throw error;
  } finally {
    client.release(); // Liberar el cliente al pool
  }
}

module.exports = {
  buscarUsuarioPorCorreo,
  crearUsuarioCliente, 
};