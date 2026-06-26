// =====================================================================
// CONFIG: db.js (Ubicación: src/config/db.js)
// Manejo centralizado del Pool de conexiones a PostgreSQL.
// =====================================================================
const { Pool } = require('pg');
const path = require('path');

// FUERZA la lectura del archivo .env subiendo dos niveles hasta la raíz
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Inicialización del pool usando las variables de entorno inyectadas
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, // Ahora sí, garantizado con el config de arriba
  max: 10,                        // máximo de conexiones simultáneas
  idleTimeoutMillis: 30000,      // cierra conexiones inactivas tras 30s
  connectionTimeoutMillis: 2000, // falla si no conecta en 2s
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de conexiones', err);
});

// Función query para usarla en cualquier módulo
module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect(), // <--- Agregamos este helper
  pool,
};