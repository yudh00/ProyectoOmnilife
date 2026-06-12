const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10,                       // máximo de conexiones simultáneas
  idleTimeoutMillis: 30000,      // cierra conexiones inactivas tras 30s
  connectionTimeoutMillis: 2000, // falla si no conecta en 2s
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de conexiones', err);
});

// función query para usarla en cualquier módulo
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};