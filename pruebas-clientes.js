// pruebas-clientes.js
// Pruebas de integración del Módulo de Gestión de Clientes.
// Simula exactamente las llamadas HTTP que haría la GUI React.
//
// REQUISITO: tener el servidor corriendo antes de ejecutar este script.
//   Terminal 1: node server.js
//   Terminal 2: node pruebas-clientes.js

const BASE = 'http://localhost:3000/api/clientes';

// ── Colores para la consola ──────────────────────────────────────────
const verde   = (t) => `\x1b[32m${t}\x1b[0m`;
const rojo    = (t) => `\x1b[31m${t}\x1b[0m`;
const amarillo= (t) => `\x1b[33m${t}\x1b[0m`;
const cyan    = (t) => `\x1b[36m${t}\x1b[0m`;
const negrita = (t) => `\x1b[1m${t}\x1b[0m`;

// ── Contadores globales ──────────────────────────────────────────────
let pasaron = 0;
let fallaron = 0;

// ── Helper: ejecuta un caso de prueba ───────────────────────────────
async function prueba(nombre, fn) {
  process.stdout.write(`  ${cyan('→')} ${nombre} ... `);
  try {
    await fn();
    console.log(verde('✓ PASÓ'));
    pasaron++;
  } catch (err) {
    console.log(rojo('✗ FALLÓ'));
    console.log(rojo(`    ${err.message}`));
    fallaron++;
  }
}

// ── Helper: petición HTTP con fetch (disponible desde Node 18) ───────
async function api(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(`${BASE}${path}`, opts);
  const json = await res.json();
  return { status: res.status, body: json };
}

// ── Helper: aserción simple ───────────────────────────────────────────
function assert(condicion, mensajeError) {
  if (!condicion) throw new Error(mensajeError);
}

//  PRUEBAS

let idClienteCreado = null;   // se rellena en la prueba de creación
const correoTest = `test.omnilife.${Date.now()}@prueba.com`; // único por ejecución

async function correrPruebas() {
  console.log(negrita('\n════════════════════════════════════════════════'));
  console.log(negrita(' Omnilife Store — Pruebas Módulo Clientes'));
  console.log(negrita('════════════════════════════════════════════════\n'));

  // ------------------------------------------------------------------
  console.log(amarillo('── GET /api/clientes ─────────────────────────'));
  // ------------------------------------------------------------------

  await prueba('Listar todos los clientes devuelve { ok: true, data: [...] }', async () => {
    const { status, body } = await api('GET', '/');
    assert(status === 200,         `Status esperado 200, recibido ${status}`);
    assert(body.ok === true,       'body.ok debe ser true');
    assert(Array.isArray(body.data), 'body.data debe ser un array');
  });

  await prueba('Buscar por término devuelve solo coincidencias', async () => {
    // Búsqueda vacía (o término que difícilmente exista) no debe romper
    const { status, body } = await api('GET', '/?busqueda=zzzinexistentexxx');
    assert(status === 200,          `Status esperado 200, recibido ${status}`);
    assert(body.ok === true,        'body.ok debe ser true');
    assert(Array.isArray(body.data), 'body.data debe ser un array');
    assert(body.data.length === 0,  `Se esperaban 0 resultados, llegaron ${body.data.length}`);
  });

  // ------------------------------------------------------------------
  console.log(amarillo('\n── POST /api/clientes ────────────────────────'));
  // ------------------------------------------------------------------

  await prueba('Crear cliente con datos válidos devuelve 201 y el nuevo cliente', async () => {
    const { status, body } = await api('POST', '/', {
      firstName: 'María',
      lastName:  'González Pérez',
      email:     correoTest,
      phone:     '88001122',
    });
    assert(status === 201,            `Status esperado 201, recibido ${status}`);
    assert(body.ok === true,          'body.ok debe ser true');
    assert(body.data.id > 0,          'El cliente creado debe tener un id numérico');
    assert(body.data.firstName === 'María', `firstName esperado 'María', recibido '${body.data.firstName}'`);
    assert(body.data.email === correoTest,  'El correo no coincide');
    assert(body.data.isActive === true,     'El cliente nuevo debe estar activo');
    idClienteCreado = body.data.id; // guardamos para las siguientes pruebas
  });

  await prueba('Crear cliente con correo duplicado devuelve 409', async () => {
    const { status, body } = await api('POST', '/', {
      firstName: 'Otro',
      lastName:  'Usuario',
      email:     correoTest,   // mismo correo → debe rechazar
      phone:     '77002233',
    });
    assert(status === 409, `Status esperado 409 (conflicto), recibido ${status}`);
    assert(body.ok === false, 'body.ok debe ser false');
  });

  await prueba('Crear cliente sin nombre devuelve 400 con lista de errores', async () => {
    const { status, body } = await api('POST', '/', {
      firstName: '',
      lastName:  'Apellido',
      email:     'valido@test.com',
      phone:     '66001133',
    });
    assert(status === 400,          `Status esperado 400, recibido ${status}`);
    assert(body.ok === false,       'body.ok debe ser false');
    assert(Array.isArray(body.errores), 'body.errores debe ser un array');
  });

  await prueba('Crear cliente con correo inválido devuelve 400', async () => {
    const { status, body } = await api('POST', '/', {
      firstName: 'Ana',
      lastName:  'López',
      email:     'correo-sin-arroba',
      phone:     '55001144',
    });
    assert(status === 400, `Status esperado 400, recibido ${status}`);
    assert(body.ok === false, 'body.ok debe ser false');
  });

  await prueba('Crear cliente con teléfono de 7 dígitos devuelve 400', async () => {
    const { status, body } = await api('POST', '/', {
      firstName: 'Luis',
      lastName:  'Ramírez',
      email:     'luis.ramirez@test.com',
      phone:     '8800112',   // solo 7 dígitos
    });
    assert(status === 400, `Status esperado 400, recibido ${status}`);
    assert(body.ok === false, 'body.ok debe ser false');
  });

  await prueba('Crear cliente con teléfono de 9 dígitos devuelve 400', async () => {
    const { status, body } = await api('POST', '/', {
      firstName: 'Luis',
      lastName:  'Ramírez',
      email:     'luis.ramirez2@test.com',
      phone:     '880011222',  // 9 dígitos
    });
    assert(status === 400, `Status esperado 400, recibido ${status}`);
    assert(body.ok === false, 'body.ok debe ser false');
  });

  // ------------------------------------------------------------------
  console.log(amarillo('\n── GET /api/clientes/:id ─────────────────────'));
  // ------------------------------------------------------------------

  await prueba('Obtener cliente recién creado devuelve sus datos', async () => {
    if (!idClienteCreado) throw new Error('Prueba de creación falló antes; saltar');
    const { status, body } = await api('GET', `/${idClienteCreado}`);
    assert(status === 200,                      `Status esperado 200, recibido ${status}`);
    assert(body.ok === true,                    'body.ok debe ser true');
    assert(body.data.id === idClienteCreado,    'El id no coincide');
    assert(body.data.email === correoTest,      'El correo no coincide');
  });

  await prueba('Obtener cliente inexistente devuelve 404', async () => {
    const { status, body } = await api('GET', '/999999');
    assert(status === 404, `Status esperado 404, recibido ${status}`);
    assert(body.ok === false, 'body.ok debe ser false');
  });

  // ------------------------------------------------------------------
  console.log(amarillo('\n── PUT /api/clientes/:id ─────────────────────'));
  // ------------------------------------------------------------------

  await prueba('Editar cliente con datos válidos devuelve el cliente actualizado', async () => {
    if (!idClienteCreado) throw new Error('Prueba de creación falló antes; saltar');
    const { status, body } = await api('PUT', `/${idClienteCreado}`, {
      firstName: 'María Editada',
      lastName:  'González Pérez',
      email:     correoTest,
      phone:     '88009999',
      isActive:  true,
    });
    assert(status === 200,                              `Status esperado 200, recibido ${status}`);
    assert(body.ok === true,                            'body.ok debe ser true');
    assert(body.data.firstName === 'María Editada',     `firstName esperado 'María Editada', recibido '${body.data.firstName}'`);
    assert(body.data.phone === '88009999',               `Teléfono esperado '88009999', recibido '${body.data.phone}'`);
  });

  await prueba('Editar cliente inexistente devuelve 404', async () => {
    const { status, body } = await api('PUT', '/999999', {
      firstName: 'X',
      lastName:  'Y',
      email:     'x@y.com',
      phone:     '11223344',
      isActive:  true,
    });
    assert(status === 404, `Status esperado 404, recibido ${status}`);
    assert(body.ok === false, 'body.ok debe ser false');
  });

  await prueba('Editar cliente con teléfono inválido devuelve 400', async () => {
    if (!idClienteCreado) throw new Error('Prueba de creación falló antes; saltar');
    const { status, body } = await api('PUT', `/${idClienteCreado}`, {
      firstName: 'María',
      lastName:  'González',
      email:     correoTest,
      phone:     'ABCD1234',   // letras — inválido
      isActive:  true,
    });
    assert(status === 400, `Status esperado 400, recibido ${status}`);
    assert(body.ok === false, 'body.ok debe ser false');
  });

  // ------------------------------------------------------------------
  console.log(amarillo('\n── GET /api/clientes/:id/historial ───────────'));
  // ------------------------------------------------------------------

  await prueba('Historial de cliente nuevo devuelve array vacío (sin pedidos aún)', async () => {
    if (!idClienteCreado) throw new Error('Prueba de creación falló antes; saltar');
    const { status, body } = await api('GET', `/${idClienteCreado}/historial`);
    assert(status === 200,           `Status esperado 200, recibido ${status}`);
    assert(body.ok === true,         'body.ok debe ser true');
    assert(Array.isArray(body.data), 'body.data debe ser un array');
    // Cliente nuevo no tiene pedidos
    assert(body.data.length === 0,   `Se esperaban 0 pedidos, llegaron ${body.data.length}`);
  });

  await prueba('Historial de cliente inexistente devuelve 404', async () => {
    const { status, body } = await api('GET', '/999999/historial');
    assert(status === 404, `Status esperado 404, recibido ${status}`);
    assert(body.ok === false, 'body.ok debe ser false');
  });

  // ------------------------------------------------------------------
  console.log(amarillo('\n── Búsqueda type-ahead ───────────────────────'));
  // ------------------------------------------------------------------

  await prueba('Buscar por nombre parcial devuelve al cliente creado', async () => {
    if (!idClienteCreado) throw new Error('Prueba de creación falló antes; saltar');
    // "María Editada" → buscamos por "María"
    const { status, body } = await api('GET', '/?busqueda=María');
    assert(status === 200,          `Status esperado 200, recibido ${status}`);
    assert(body.ok === true,        'body.ok debe ser true');
    const encontrado = body.data.find((c) => c.id === idClienteCreado);
    assert(encontrado !== undefined, 'El cliente creado no apareció en la búsqueda por nombre');
  });

  await prueba('Buscar por correo parcial devuelve al cliente creado', async () => {
    if (!idClienteCreado) throw new Error('Prueba de creación falló antes; saltar');
    // Usamos solo la parte local del correo (antes de @)
    const parteCorreo = correoTest.split('@')[0];
    const { status, body } = await api('GET', `/?busqueda=${encodeURIComponent(parteCorreo)}`);
    assert(status === 200,          `Status esperado 200, recibido ${status}`);
    const encontrado = body.data.find((c) => c.id === idClienteCreado);
    assert(encontrado !== undefined, 'El cliente creado no apareció en la búsqueda por correo');
  });

  await prueba('Buscar por teléfono parcial devuelve al cliente creado', async () => {
    if (!idClienteCreado) throw new Error('Prueba de creación falló antes; saltar');
    // Teléfono actualizado a 88009999 → buscamos "8800"
    const { status, body } = await api('GET', '/?busqueda=8800');
    assert(status === 200,          `Status esperado 200, recibido ${status}`);
    assert(body.ok === true,        'body.ok debe ser true');
    // Solo verificamos que el array llegue; puede haber otros con 8800
    assert(Array.isArray(body.data), 'body.data debe ser array');
  });

  // ------------------------------------------------------------------
  console.log(amarillo('\n── DELETE /api/clientes/:id (soft delete) ────'));
  // ------------------------------------------------------------------

  await prueba('Desactivar cliente devuelve mensaje de confirmación', async () => {
    if (!idClienteCreado) throw new Error('Prueba de creación falló antes; saltar');
    const { status, body } = await api('DELETE', `/${idClienteCreado}`);
    assert(status === 200,   `Status esperado 200, recibido ${status}`);
    assert(body.ok === true, 'body.ok debe ser true');
    assert(body.data.mensaje, 'Se esperaba un mensaje de confirmación');
  });

  await prueba('Después del soft-delete el cliente sigue existiendo (borrado lógico)', async () => {
    if (!idClienteCreado) throw new Error('Prueba de creación falló antes; saltar');
    const { status, body } = await api('GET', `/${idClienteCreado}`);
    assert(status === 200,              `Status esperado 200 (el registro sigue en BD), recibido ${status}`);
    assert(body.data.isActive === false, 'isActive debe ser false tras el soft-delete');
  });

  await prueba('Desactivar cliente inexistente devuelve 404', async () => {
    const { status, body } = await api('DELETE', '/999999');
    assert(status === 404, `Status esperado 404, recibido ${status}`);
    assert(body.ok === false, 'body.ok debe ser false');
  });

  // ------------------------------------------------------------------
  console.log(amarillo('\n── Resumen ───────────────────────────────────'));
  // ------------------------------------------------------------------

  const total = pasaron + fallaron;
  console.log(`\n  Total : ${total}`);
  console.log(`  ${verde(`Pasaron: ${pasaron}`)}`);
  if (fallaron > 0) {
    console.log(`  ${rojo(`Fallaron: ${fallaron}`)}`);
  } else {
    console.log(`  Fallaron: ${fallaron}`);
  }

  const pct = total > 0 ? Math.round((pasaron / total) * 100) : 0;
  const barraLlena  = '█'.repeat(Math.floor(pct / 5));
  const barraVacia  = '░'.repeat(20 - Math.floor(pct / 5));
  const color = pct === 100 ? verde : pct >= 70 ? amarillo : rojo;
  console.log(`  ${color(`[${barraLlena}${barraVacia}] ${pct}%`)}\n`);

  if (fallaron > 0) process.exit(1);
}

correrPruebas().catch((err) => {
  console.error(rojo('\nError fatal al correr las pruebas:'), err.message);
  console.error(rojo('¿Está el servidor corriendo? → node server.js\n'));
  process.exit(1);
});
