// =====================================================================
// SERVER: server.js
// Servidor Express principal. Punto de entrada del API.
// Registra todos los modulos (Catalogo y Ventas, y futuros modulos).
// =====================================================================

const express = require('express');
const db = require('./src/config/db');
const ventasRoutes = require('./src/ventas/routes/ventas.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log basico de peticiones
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const r = await db.query('SELECT NOW() AS hora');
    res.json({ ok: true, hora: r.rows[0].hora });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Registro de modulos
app.use('/api/ventas', ventasRoutes);

// Handler de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Endpoint no encontrado' });
});

// Handler global de errores no capturados
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({ ok: false, error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor Omnilife Store escuchando en puerto ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(`Catalogo: http://localhost:${PORT}/api/ventas/catalogo`);
});

// Cierre limpio
process.on('SIGINT', async () => {
  console.log('\nCerrando conexiones...');
  await db.pool.end();
  process.exit(0);
});
