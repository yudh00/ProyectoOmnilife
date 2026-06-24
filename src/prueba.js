// prueba-env.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('--- DIAGNÓSTICO DE ENTORNO ---');
console.log('Ruta actual de ejecución:', process.cwd());
console.log('¿Existe el archivo .env en esta ruta?:', fs.existsSync(path.join(process.cwd(), '.env')));
console.log('Contraseña leída del .env:', process.env.DB_PASSWORD ? '¡SÍ SE LEYÓ!' : '❌ NO SE LEYÓ (Es undefined)');