// =====================================================================
// SCRIPT: init-db.js
// Automatización e inicialización de la Base de Datos.
// =====================================================================
const path = require('path');
// CRÍTICO: Obliga a dotenv a buscar el archivo .env en la misma raíz que este script
require('dotenv').config({ path: path.resolve(__dirname, '.env') }); 

const fs = require('fs');
const { Client } = require('pg'); 
const db = require('./src/config/db');

async function inicializarBaseDatos() {

  // Captura el nombre exacto de tu .env (ProyectoIngeneria)
  const dbName = process.env.DB_NAME || 'ProyectoIngeneria';

  // Configuración para conectar temporalmente a la BD base 'postgres'
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

    // 2. Ejecutar el script principal de tablas usando tu conexión estándar (db)
    const scriptTablasPath = path.join(__dirname, 'data', 'Script BD and Tablas.sql');
    if (fs.existsSync(scriptTablasPath)) {
      console.log('📦 Creando tablas base...');
      let sqlTablas = fs.readFileSync(scriptTablasPath, 'utf8');
      
      // Limpieza preventiva de comandos CREATE DATABASE dentro del archivo
      sqlTablas = sqlTablas.replace(/CREATE DATABASE[\s\S]*?;/i, '');
      
      await db.query(sqlTablas);
      console.log('✅ Tablas creadas o verificadas exitosamente.');
    } else {
      throw new Error('No se encontró el archivo "Script BD and Tablas.sql" en data/');
    }

    // 3. Procedimientos Almacenados en orden
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
        console.log(`✅ ${archivo} cargado correctamente.`);
      }
    }

    console.log(`\n🚀 ¡Todo listo! La base de datos "${dbName}" se ha configurado por completo.`);
    
    // Si ejecutas init-db de manera independiente, cierra el proceso limpio
    if (require.main === module) {
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Error crítico durante la automatización:', error.message);
    try { await clienteTemporal.end(); } catch (e) {}
    process.exit(1);
  }
}

// Ejecuta la inicialización de forma directa si se llama por consola
if (require.main === module) {
  inicializarBaseDatos();
}

module.exports = inicializarBaseDatos;