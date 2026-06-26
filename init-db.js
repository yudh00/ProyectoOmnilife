// =====================================================================
// SCRIPT: init-db.js
// Automatización e inicialización de la Base de Datos.
// =====================================================================
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') }); 

const fs = require('fs');
const { Client } = require('pg'); 
const bcrypt = require('bcrypt'); // Importamos bcrypt
const db = require('./src/config/db');

async function insertarDatosSemilla() {
  console.log('\n🌱 Insertando datos semilla (Admin)...');
  
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  try {
    // 1. Insertar Admin en Usuario si no existe (buscando por correo para mayor seguridad)
    await db.query(`
      INSERT INTO Usuario (IdUsuario, CorreoElectronico, NombreUsuario, ApellidosUsuario, IdRol, Contrasena)
      SELECT 1, 'admin@omni.com', 'Dylan Admin', 'Solano Pereira', 1, $1
      WHERE NOT EXISTS (SELECT 1 FROM Usuario WHERE IdUsuario = 1);
    `, [hashedPassword]);

    // 2. Insertar en Administrador solo si el usuario 1 existe
    await db.query(`
      INSERT INTO Administrador (IdUsuario, FechaIngreso)
      SELECT 1, CURRENT_DATE
      WHERE NOT EXISTS (SELECT 1 FROM Administrador WHERE IdUsuario = 1);
    `);

    console.log('✅ Administrador semilla generado con seguridad.');
  } catch (error) {
    console.error('❌ Error al insertar datos semilla:', error.message);
    throw error;
  }
}

async function inicializarBaseDatos() {
  const dbName = process.env.DB_NAME || 'ProyectoIngeneria';
  const configTemporal = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD, 
    database: 'postgres', 
  };

  const clienteTemporal = new Client(configTemporal);

  try {
    console.log('⏳ Verificando la existencia de la base de datos...');
    await clienteTemporal.connect();
    
    const res = await clienteTemporal.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`, 
      [dbName]
    );

    if (res.rowCount === 0) {
      console.log(`🔨 Creando la base de datos "${dbName}"...`);
      await clienteTemporal.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Base de datos "${dbName}" creada con éxito.`);
    } else {
      console.log(`ℹ️ La base de datos "${dbName}" ya existe.`);
    }
    
    await clienteTemporal.end();

    console.log('\n📦 Iniciando estructuración de tablas y funciones...');

    // Ejecutar script principal
    const scriptTablasPath = path.join(__dirname, 'data', 'Script BD and Tablas.sql');
    if (fs.existsSync(scriptTablasPath)) {
      console.log('📦 Creando tablas base...');
      let sqlTablas = fs.readFileSync(scriptTablasPath, 'utf8');
      sqlTablas = sqlTablas.replace(/CREATE DATABASE[\s\S]*?;/i, '');
      await db.query(sqlTablas);
      console.log('✅ Tablas creadas o verificadas exitosamente.');
    } else {
      throw new Error('No se encontró el archivo "Script BD and Tablas.sql" en data/');
    }

    // Ejecutar Procedimientos
    const archivosSP = [
      '01_sp_catalogo_ventas.sql',
      '02_sp_alteraciones_bd.sql',
      '03_sp_clientes.sql',
      'sp_modulo_financiero.sql'
    ];

    for (const archivo of archivosSP) {
      const spPath = path.join(__dirname, 'data', 'sp', archivo);
      if (fs.existsSync(spPath)) {
        console.log(`⚙️ Inyectando funciones: ${archivo}...`);
        const sqlSP = fs.readFileSync(spPath, 'utf8');
        await db.query(sqlSP);
      }
    }

    // Insertar datos iniciales (Seed)
    await insertarDatosSemilla();

    console.log(`\n🚀 ¡Todo listo! La base de datos "${dbName}" se ha configurado por completo.`);
    
    if (require.main === module) {
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Error crítico durante la automatización:', error.message);
    try { await clienteTemporal.end(); } catch (e) {}
    process.exit(1);
  }
}

if (require.main === module) {
  inicializarBaseDatos();
}

module.exports = inicializarBaseDatos;