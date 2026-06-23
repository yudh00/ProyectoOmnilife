const db = require('./src/config/db');

(async () => {
  try {
    const result = await db.query('SELECT NOW() AS hora_actual');
    console.log(' Conexión exitosa. Hora del servidor:', result.rows[0].hora_actual);

    // Prueba opcional: contar estados
    const estados = await db.query('SELECT * FROM estado where idestado= 1');
    console.log('Información del estado:', estados.rows[0]);
  } catch (err) {
    console.error(' Error al conectar:', err.message);
  } finally {
    await db.pool.end(); // cierra al terminar la prueba
  }
})();