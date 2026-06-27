# Análisis Técnico: Principios SOLID y Patrones de Diseño
## ProyectoOmnilife — Omnilife Store

---

## 1. Descripción General del Proyecto

**ProyectoOmnilife** es una aplicación web fullstack para la venta de productos Omnilife. Está compuesta por:

| Capa | Tecnología |
|---|---|
| Backend (API REST) | Node.js + Express.js |
| Frontend (SPA) | React + TypeScript + Vite |
| Base de datos | PostgreSQL (con Stored Procedures) |
| Seguridad | JWT + Bcrypt |
| Email | Nodemailer |

### Arquitectura General

```
ProyectoOmnilife/
├── server.js                  ← Punto de entrada del servidor
├── src/
│   ├── config/db.js           ← Pool de conexiones PostgreSQL
│   ├── utils/
│   │   ├── AppError.js        ← Clase de errores de dominio
│   │   ├── response.js        ← Helpers de respuesta HTTP
│   │   └── email.service.js   ← Servicio de correos
│   ├── auth/                  ← Módulo de Autenticación
│   ├── ventas/                ← Módulo de Catálogo/Carrito/Pedidos
│   ├── clientes/              ← Módulo de Gestión de Clientes
│   ├── financiero/            ← Módulo de Reportes Financieros
│   └── productos/             ← Módulo de Administración de Productos
└── Presentation/src/
    ├── context/               ← Estado global (React Context)
    ├── hooks/                 ← Lógica de negocio del frontend
    ├── components/            ← Componentes UI reutilizables
    ├── guards/                ← Protección de rutas por rol
    ├── services/              ← Clientes HTTP
    └── types/                 ← Contratos TypeScript (interfaces)
```

Cada módulo del backend sigue la misma estructura de capas:

```
modulo/
├── routes/       → Define los endpoints REST
├── controllers/  → Maneja req/res HTTP
├── services/     → Lógica de negocio
├── repositories/ → Acceso a la base de datos
└── validators/   → Validación de entradas
```

---

## 2. Principios SOLID

Los principios SOLID son cinco reglas de diseño orientado a objetos que buscan que el software sea más mantenible, extensible y comprensible.

---

### S — Single Responsibility Principle (SRP)
**"Una clase/módulo debe tener una sola razón para cambiar."**

Cada archivo del proyecto tiene exactamente una responsabilidad asignada. Si algo cambia (las reglas de validación, el formato de respuesta, la lógica de negocio), solo hay que tocar un archivo.

#### En el Backend

| Archivo | Única responsabilidad |
|---|---|
| `auth.validator.js` | Validar formato de credenciales (email, contraseña, teléfono) |
| `auth.repository.js` | Ejecutar SQL/SP para buscar/crear usuarios en BD |
| `auth.service.js` | Reglas de negocio: verificar contraseña con bcrypt, generar JWT |
| `auth.controller.js` | Traducir la petición HTTP al servicio y dar respuesta JSON |
| `AppError.js` | Representar errores de dominio con código HTTP |
| `response.js` | Dar formato uniforme `{ ok, data }` o `{ ok, error }` a todas las respuestas |
| `email.service.js` | Enviar correos de confirmación a clientes y administradores |
| `db.js` | Administrar el pool de conexiones a PostgreSQL |

**Ejemplo concreto:**
```
// auth.validator.js — SU ÚNICA RAZÓN DE EXISTIR: validar datos de entrada
function validarLogin({ email, password }) { ... }
function validarRegistro({ nombre, apellidos, email, password, telefono }) { ... }

// Si mañana cambia el formato del teléfono de 8 a 9 dígitos,
// SOLO se modifica este archivo. El servicio y el controlador no se tocan.
```

```
// response.js — SU ÚNICA RAZÓN DE EXISTIR: formato uniforme de respuestas
function ok(res, data, status = 200) { ... }
function created(res, data) { ... }
function fail(res, err) { ... }

// Antes de este helper, cada controlador repetía res.json({ ok: true, data })
// localmente. Con SRP, la responsabilidad se centraliza aquí.
```

#### En el Frontend

| Archivo | Única responsabilidad |
|---|---|
| `AuthContext.tsx` | Mantener el estado de sesión del usuario en memoria |
| `useCart.ts` | Estado y operaciones del carrito (agregar, quitar, confirmar pedido) |
| `useProducts.ts` | Cargar catálogo y actualizar stock |
| `useClients.ts` | CRUD de clientes |
| `useFinances.ts` | Obtener datos financieros del período |
| `AdminGuard.tsx` | Controlar acceso solo para administradores |
| `ClientGuard.tsx` | Controlar acceso solo para clientes |

---

### O — Open/Closed Principle (OCP)
**"El código debe estar abierto para extensión, pero cerrado para modificación."**

Se aplica principalmente en la forma en que los servicios son construidos y en cómo `AppError` maneja los tipos de error.

#### En AppError.js

```javascript
// AppError.js — Cerrado para modificación, abierto para extensión
class AppError extends Error {
  constructor(message, status = 500, errores = null) { ... }

  // Factory methods: si necesitamos un nuevo tipo de error (ej. 422 Unprocessable),
  // AGREGAMOS un método nuevo sin tocar los existentes.
  static badRequest(message)   { return new AppError(message, 400); }
  static unauthorized(message) { return new AppError(message, 401); }
  static forbidden(message)    { return new AppError(message, 403); }
  static notFound(message)     { return new AppError(message, 404); }
  static conflict(message)     { return new AppError(message, 409); }
}
```

Si mañana necesitamos un error 422 (Unprocessable Entity), solo agregamos `static unprocessable(message) { return new AppError(message, 422); }` sin modificar los demás métodos.

#### En los Servicios (Factory de Servicio)

```javascript
// clientes.service.js
function crearServicioClientes(repo) {
  // Toda la lógica del servicio trabaja con `repo` de forma abstracta
  async function listarClientes(busqueda) {
    return (await repo.listarClientes(busqueda)).map(mapearCliente);
  }
  // ...
}

// Producción: se inyecta el repositorio real de PostgreSQL
const repo = require('../repositories/clientes.repository');
module.exports = crearServicioClientes(repo);

// Para tests: se puede inyectar un repo mock SIN modificar el servicio
module.exports.crearServicioClientes = crearServicioClientes;
```

El servicio está **cerrado** para modificación (su lógica interna no cambia) y **abierto** para extensión (se le puede pasar cualquier repositorio diferente sin editar el archivo).

---

### L — Liskov Substitution Principle (LSP)
**"Los objetos de una subclase deben poder reemplazar a los de la clase base sin alterar el comportamiento del programa."**

Aunque el proyecto usa JavaScript (no herencia clásica), LSP se aplica a través del patrón de **contratos implícitos** entre capas.

#### En los Repositorios (contrato implícito)

El servicio `crearServicioClientes(repo)` solo exige que `repo` tenga estas funciones:

```javascript
repo.listarClientes(busqueda)
repo.obtenerClientePorId(id)
repo.crearCliente(datos)
repo.actualizarCliente(id, datos)
repo.desactivarCliente(id)
repo.obtenerHistorialCliente(id)
```

Cualquier objeto que implemente ese contrato puede **sustituir** al repositorio real:

```javascript
// repositorio real → llama a PostgreSQL
const repoReal = require('./clientes.repository');

// repositorio mock → para pruebas unitarias (sin BD)
const repoMock = {
  listarClientes: async () => [{ idcliente: 1, nombreusuario: 'Test', ... }],
  obtenerClientePorId: async (id) => ({ idcliente: id, ... }),
  // ...
};

// Ambos son intercambiables — el servicio funciona igual con cualquiera
const servicioProduccion = crearServicioClientes(repoReal);
const servicioTest       = crearServicioClientes(repoMock);
```

#### En los Guards del Frontend

`AdminGuard` y `ClientGuard` siguen la misma interfaz de props:

```typescript
// Ambos son sustituibles como wrappers de control de acceso
<AdminGuard>  <ContenidoAdmin />  </AdminGuard>
<ClientGuard> <ContenidoCliente /></ClientGuard>
```

---

### I — Interface Segregation Principle (ISP)
**"Los clientes no deben depender de interfaces que no usan."**

Cada capa del proyecto expone exactamente las funciones que sus consumidores necesitan, sin funciones extra.

#### En los Repositorios

```javascript
// auth.repository.js — exporta SOLO lo que auth.service.js necesita
module.exports = {
  buscarUsuarioPorCorreo,   // necesario para login
  crearUsuarioCliente,      // necesario para registro
};
// No expone funciones de otro módulo (clientes, productos, etc.)
```

```javascript
// financiero.repository.js — exporta SOLO las 6 consultas financieras
module.exports = {
  obtenerIngresosPeriodo,
  obtenerGastosPeriodo,
  obtenerFlujoCajaNeto,
  obtenerEstadisticasPeriodo,
  obtenerRentabilidadPorPeriodo,
  calcularRentabilidadProducto,
};
```

#### En los Hooks del Frontend

```typescript
// useAuth() — expone solo lo que los componentes necesitan saber de la sesión
return { currentUser, isAuthenticated, isAdmin, isClient, refreshAuth, logout };

// useCart() — expone solo las operaciones del carrito
return { items, totalItems, totalPrice, isOpen, openCart, closeCart,
         addItem, updateQuantity, removeItem, clearCart, confirmOrder };
```

#### En las Interfaces TypeScript

```typescript
// types/index.ts — interfaces separadas por dominio, no una mega-interfaz
interface AuthUser { idUsuario, nombreUsuario, apellidosUsuario, ... }
interface Client   { id, firstName, lastName, email, phone, ... }
interface Product  { id, name, category, price, imageUrl, stock, ... }
interface CartItem { product: Product, quantity: number }
```

Cada componente solo importa la interfaz que necesita; no tiene que cargar toda la definición de tipos.

---

### D — Dependency Inversion Principle (DIP)
**"Los módulos de alto nivel no deben depender de módulos de bajo nivel. Ambos deben depender de abstracciones."**

Este es el principio más explícito en el proyecto. Se implementa mediante el **patrón Factory de Servicio** con inyección de dependencias manual.

#### Patrón Factory en Servicios (Backend)

Aplicado en tres módulos: `auth`, `clientes` y `financiero`:

```javascript
// auth.service.js — Alto nivel: servicio de negocio
function crearServicioAuth(repo) {          // ← recibe la abstracción (repo)
  async function autenticarUsuario(correo, contrasena) {
    validator.validarLogin({ email: correo, password: contrasena });
    const usuario = await repo.buscarUsuarioPorCorreo(correo); // ← usa la abstracción
    // ...
  }
  return { autenticarUsuario, registerClient };
}

// Bajo nivel: repositorio PostgreSQL real
const repo = require('../repositories/auth.repository');
module.exports = crearServicioAuth(repo); // ← el wire-up ocurre aquí, afuera del servicio

// Para testing: exportamos la factory para inyectar mocks
module.exports.crearServicioAuth = crearServicioAuth;
```

El flujo de dependencias respetando DIP:

```
[auth.controller.js]  →  depende de  →  [auth.service interface]
[auth.service.js]     →  depende de  →  [repo interface (parámetro)]
[auth.repository.js]  →  implementa  →  [repo interface]
[db.js]               →  abstrae     →  [pg Pool de PostgreSQL]
```

#### En el Frontend

Los componentes no hablan directamente con `localStorage` ni con `fetch`. Dependen de abstracciones (hooks y contextos):

```typescript
// Un componente NO hace esto (dependencia directa de bajo nivel):
const raw = localStorage.getItem('omnilife_user'); // ❌ viola DIP

// Un componente SÍ hace esto (depende de la abstracción useAuth):
const { currentUser, isAdmin } = useAuth(); // ✅ respeta DIP

// useAuth() encapsula cómo se obtiene el usuario (puede cambiar la implementación
// de localStorage a cookies o sessionStorage sin tocar los componentes)
```

---

## 3. Patrones de Diseño

Los patrones de diseño son soluciones probadas a problemas recurrentes en el desarrollo de software.

---

### 3.1 Repository Pattern (Patrón Repositorio)

**Categoría:** Arquitectural / Acceso a datos

**¿Qué hace?** Abstrae la capa de acceso a datos detrás de una interfaz. El servicio no sabe si los datos vienen de PostgreSQL, un archivo, una caché o un mock.

**¿Dónde está?** En todos los módulos:
- `src/auth/repositories/auth.repository.js`
- `src/ventas/repositories/ventas.repository.js`
- `src/clientes/repositories/clientes.repository.js`
- `src/financiero/repositories/financiero.repository.js`
- `src/productos/repositories/productos.repository.js`

**Cómo funciona:**

```javascript
// clientes.repository.js — Solo habla con la base de datos
async function listarClientes(busqueda = null) {
  const { rows } = await db.query('SELECT * FROM sp_listar_clientes($1)', [busqueda]);
  return rows;
}

// clientes.service.js — Solo conoce la interfaz del repo, no cómo funciona por dentro
const filas = await repo.listarClientes(termino); // podría ser PostgreSQL, Oracle, o mock
return filas.map(mapearCliente);
```

**¿Por qué se usó?** Para que cambiar la base de datos (de PostgreSQL a MySQL, por ejemplo) solo requiera reescribir los repositorios, no los servicios.

---

### 3.2 Factory Method (Método Fábrica)

**Categoría:** Creacional

**¿Qué hace?** Define una interfaz para crear objetos, pero deja a las subclases (o en este caso, a los parámetros) decidir qué objeto se instancia.

**¿Dónde está?**

**a) AppError — Factory Methods estáticos:**

```javascript
// AppError.js
class AppError extends Error {
  constructor(message, status, errores) { ... }

  // Métodos fábrica — crean instancias con configuración específica
  static badRequest(msg)   { return new AppError(msg, 400); }  // Fábrica de error 400
  static unauthorized(msg) { return new AppError(msg, 401); }  // Fábrica de error 401
  static notFound(msg)     { return new AppError(msg, 404); }  // Fábrica de error 404
  static conflict(msg)     { return new AppError(msg, 409); }  // Fábrica de error 409
}

// Uso en servicios — limpio y expresivo:
throw AppError.notFound(`Cliente ${id} no encontrado`);     // en lugar de new AppError(...)
throw AppError.conflict('El correo ya está registrado');
throw AppError.unauthorized('Credenciales incorrectas');
```

**b) Service Factories — crean instancias del servicio con dependencia inyectada:**

```javascript
// auth.service.js
function crearServicioAuth(repo) { ... }       // Fábrica del servicio Auth
// clientes.service.js
function crearServicioClientes(repo) { ... }   // Fábrica del servicio Clientes
// financiero.service.js
function crearServicioFinanciero(repo) { ... } // Fábrica del servicio Financiero
```

---

### 3.3 DTO Pattern + Mapper (Data Transfer Object)

**Categoría:** Estructural / Arquitectural

**¿Qué hace?** Transforma datos de un formato interno (filas crudas de PostgreSQL en minúsculas) al formato que espera el cliente externo (camelCase, interfaces TypeScript).

**¿Dónde está?**

**a) Backend — Servicios como capa de mapeo:**

```javascript
// auth.service.js — DTO de autenticación
function mapearUsuarioAutenticado(usuario, token) {
  return {
    idUsuario:         usuario.idusuario,        // BD: idusuario → API: idUsuario
    correoElectronico: usuario.correoelectronico, // BD: correoelectronico → API: correoElectronico
    nombreUsuario:     usuario.nombreusuario,
    apellidosUsuario:  usuario.apellidosusuario,
    idRol:             usuario.idrol,
    nombreRol:         usuario.nombrerol,
    idCliente:         usuario.idcliente ?? null,
    token:             token
  };
}
```

```javascript
// clientes.service.js — DTO de cliente (fila BD → interfaz Client de TypeScript)
function mapearCliente(row) {
  return {
    id:           row.idcliente,
    firstName:    row.nombreusuario,     // BD: nombreusuario → Front: firstName
    lastName:     row.apellidosusuario,
    email:        row.correoelectronico,
    phone:        row.telefonousuario || '',
    registeredAt: row.fecharegistro,
    isActive:     row.isactivo,
    transactions: [],
    totalTransactions: parseInt(row.totalpedidos, 10),
  };
}

// Mapper de historial: transforma filas planas en objetos anidados
function mapearHistorial(filas) {
  const pedidosMap = new Map();
  for (const fila of filas) {
    if (!pedidosMap.has(fila.idpedido)) {
      pedidosMap.set(fila.idpedido, {
        id: fila.idpedido, date: fila.fechapedido,
        estado: fila.estadopedido, items: [], total: parseFloat(fila.total),
      });
    }
    if (fila.idproducto) {
      pedidosMap.get(fila.idpedido).items.push({
        productName: fila.nombreproducto,
        quantity:    fila.cantidad,
        unitPrice:   parseFloat(fila.preciocongelado),
      });
    }
  }
  return Array.from(pedidosMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
}
```

**b) Frontend — Hooks como adaptadores:**

```typescript
// useProducts.ts — mapea BackendProduct (snake_case) → Product (camelCase)
const adaptedProducts: Product[] = data.data.map((p: BackendProduct) => ({
  id:          p.id_producto,  // snake_case → camelCase
  name:        p.nombre,
  description: p.descripcion,
  price:       p.precio,
  imageUrl:    p.imagen_url || FALLBACK_IMAGE,
  category:    parseCategory(p.categoria),
  stock:       p.stock,
}));
```

**¿Por qué se usó?** La base de datos usa una convención de nombres (snake_case, español) diferente a la que espera el frontend TypeScript (camelCase, inglés). Los DTOs/Mappers son la frontera de traducción.

---

### 3.4 Singleton Pattern (Patrón Singleton)

**Categoría:** Creacional

**¿Qué hace?** Garantiza que solo exista una instancia de un objeto en toda la aplicación.

**¿Dónde está?** `src/config/db.js`

```javascript
// db.js — El Pool se crea UNA SOLA VEZ
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME,
  max: 10,               // máximo 10 conexiones simultáneas
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Node.js cachea los módulos en require().
// Cualquier archivo que haga require('./config/db') obtiene ESTE MISMO objeto.
module.exports = {
  query:   (text, params) => pool.query(text, params),
  connect: () => pool.connect(),
  pool,
};
```

Todos los repositorios usan `const db = require('../../config/db')` y todos comparten el mismo pool de conexiones. No se crean 5 pools diferentes.

---

### 3.5 Observer Pattern (Patrón Observador)

**Categoría:** Comportamental

**¿Qué hace?** Define una dependencia uno-a-muchos entre objetos, de forma que cuando uno cambia de estado, todos sus dependientes son notificados y actualizados automáticamente.

**¿Dónde está?** `Presentation/src/context/AuthContext.tsx`

```typescript
// AuthContext.tsx
export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(readUserFromStorage);

  // El estado `currentUser` es el "sujeto observable"
  // Cualquier componente que llame useAuth() es un "observador"
  // Cuando currentUser cambia, todos los observadores se re-renderizan automáticamente

  // Además: observa cambios en OTRAS PESTAÑAS del navegador
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === AUTH_STORAGE_KEY) {
        setCurrentUser(e.newValue ? JSON.parse(e.newValue) : null);
      }
    };
    window.addEventListener('storage', handleStorage); // subscripción
    return () => window.removeEventListener('storage', handleStorage); // limpieza
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, isAdmin, isClient, ... }}>
      {children} {/* todos los componentes hijo son observadores potenciales */}
    </AuthContext.Provider>
  );
}
```

Cuando el usuario hace login o logout, el estado de `AuthContext` cambia y **todos** los componentes que llaman a `useAuth()` se actualizan: la `Navbar` muestra el nombre del usuario, los `Guards` permiten o niegan acceso, etc.

---

### 3.6 Facade Pattern (Patrón Fachada)

**Categoría:** Estructural

**¿Qué hace?** Provee una interfaz simplificada a un subsistema complejo. El cliente solo ve una llamada simple; la complejidad está escondida detrás.

**¿Dónde está?** En los servicios del backend.

**Ejemplo: ventas.service.js → confirmarPedido()**

```javascript
// Desde el controlador (cliente de la fachada), es UNA SOLA llamada:
const pedido = await service.confirmarPedido(idCliente, idCarrito, impuestoPct);

// Pero internamente (dentro de la fachada), ocurre TODO esto:
async function confirmarPedido(idCliente, idCarrito, impuestoPct) {
  // 1. Valida parámetros
  // 2. Llama al stored procedure sp_crear_pedido que:
  //    - Verifica stock de cada producto
  //    - Calcula subtotal, impuestos y total
  //    - Inserta en tabla Pedido
  //    - Inserta en tabla LineaDePedido por cada ítem
  //    - Vacía el carrito
  // 3. Mapea el resultado a un DTO limpio
  // 4. Dispara envío de dos correos en background (cliente + admin)
  //    - Obtiene datos del cliente desde BD
  //    - Obtiene datos del admin desde BD
  //    - Envía email de confirmación al cliente
  //    - Envía email de notificación al admin
  return pedido;
}
```

**Ejemplo: useCart.ts → confirmOrder() (Frontend)**

```typescript
// Desde App.tsx: una sola llamada
const result = await cart.confirmOrder();

// Internamente el hook hace:
// 1. Valida que el carrito no esté vacío
// 2. Obtiene el idCliente del contexto de auth
// 3. Por cada item: hace POST a /api/ventas/carrito (sincroniza con BD)
// 4. Hace POST a /api/ventas/pedidos (crea el pedido)
// 5. Limpia el carrito local
// 6. Retorna el resultado formateado
```

---

### 3.7 Chain of Responsibility (Cadena de Responsabilidad)

**Categoría:** Comportamental

**¿Qué hace?** Pasa una solicitud a lo largo de una cadena de manejadores, donde cada uno decide si procesa la solicitud o la pasa al siguiente.

**¿Dónde está?** `server.js` — Middleware chain de Express

```javascript
// server.js — Cadena de responsabilidad
app.use(cors({ origin: 'http://localhost:5173' }));   // Eslabón 1: CORS
app.use(express.json());                              // Eslabón 2: Parser JSON
app.use(express.urlencoded({ extended: true }));      // Eslabón 3: Parser URL
app.use((req, res, next) => {                         // Eslabón 4: Logger
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next(); // pasa al siguiente eslabón
});
app.use('/api/auth',       authRoutes);               // Eslabón 5: Rutas Auth
app.use('/api/ventas',     ventasRoutes);             // Eslabón 6: Rutas Ventas
app.use('/api/clientes',   clientesRoutes);           // Eslabón 7: Rutas Clientes
app.use('/api/financiero', financieroRoutes);         // Eslabón 8: Rutas Financiero
app.use('/api/productos',  productosRoutes);          // Eslabón 9: Rutas Productos
app.use((req, res) => { res.status(404)... });        // Eslabón 10: 404 Not Found
app.use((err, req, res, next) => { ... });            // Eslabón 11: Error global
```

Cada solicitud HTTP recorre la cadena de arriba hacia abajo. Si un eslabón no maneja la solicitud, llama a `next()` para pasar al siguiente. El handler de 404 solo se ejecuta si ninguna ruta anterior respondió.

---

### 3.8 Guard Pattern (Patrón Guardián)

**Categoría:** Comportamental / Seguridad

**¿Qué hace?** Protege el acceso a recursos comprobando una condición antes de permitir la ejecución. Si la condición no se cumple, bloquea el acceso.

**¿Dónde está?** `Presentation/src/guards/AdminGuard.tsx` y `ClientGuard.tsx`

```typescript
// AdminGuard.tsx — Protege contenido de administrador
export default function AdminGuard({ children, fallback = <AccessDenied /> }) {
  const { isAdmin } = useAuth();
  return isAdmin ? <>{children}</> : <>{fallback}</>;
  //     ↑ condición    ↑ permite    ↑ bloquea (muestra "Acceso restringido")
}

// ClientGuard.tsx — Protege contenido de cliente
export default function ClientGuard({ children, fallback = <ClientOnly /> }) {
  const { isClient } = useAuth();
  return isClient ? <>{children}</> : <>{fallback}</>;
}

// Uso en App.tsx
{currentPage === "clients" && (
  <AdminGuard>
    <ClientTable />    // Solo se renderiza si isAdmin === true
  </AdminGuard>
)}

{currentPage === "my-orders" && (
  <ClientGuard>
    <MyOrdersPage />   // Solo se renderiza si isClient === true
  </ClientGuard>
)}
```

---

### 3.9 Module Pattern (Patrón Módulo)

**Categoría:** Estructural / Creacional

**¿Qué hace?** Encapsula código en módulos con su propio ámbito, exponiendo solo lo que se necesita mediante `module.exports` (backend) o `export` (frontend).

**¿Dónde está?** En todo el proyecto. Cada módulo funcional (auth, ventas, clientes, etc.) es una unidad encapsulada:

```javascript
// clientes.repository.js — encapsula el acceso a datos, expone solo la interfaz pública
const db = require('../../config/db'); // detalle privado del módulo

async function listarClientes(busqueda) { ... }   // función privada del módulo
async function obtenerClientePorId(id) { ... }
// ...

module.exports = {              // interfaz pública: solo lo que necesitan otros
  listarClientes,
  obtenerClientePorId,
  crearCliente,
  actualizarCliente,
  desactivarCliente,
  obtenerHistorialCliente,
};
// db, detalles de SQL, etc. quedan PRIVADOS dentro del módulo
```

---

### 3.10 Custom Hook Pattern (React)

**Categoría:** Comportamental (específico de React)

**¿Qué hace?** Encapsula lógica de estado y efectos secundarios en funciones reutilizables, separando completamente la lógica de negocio de los componentes visuales.

**¿Dónde está?** Todos los hooks en `Presentation/src/hooks/`:

| Hook | Encapsula |
|---|---|
| `useAuth()` | Acceso al contexto de autenticación |
| `useCart()` | Estado del carrito + operaciones + llamadas a API |
| `useProducts()` | Carga de catálogo + actualización de stock + estado loading/error |
| `useClients()` | CRUD de clientes + búsqueda local + estado loading/error |
| `useFinances()` | Carga de datos financieros + rentabilidad por producto |
| `useOrders()` | Gestión de pedidos para admin |
| `useMyOrders()` | Pedidos del cliente autenticado |

```typescript
// useProducts.ts — lógica completamente encapsulada
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState<boolean>(false);
  const [error, setError]       = useState<string | null>(null);

  const fetchProducts = useCallback(async () => { ... }); // llama al API
  const updateStock   = useCallback(async (productId, delta) => { ... }); // actualiza stock

  useEffect(() => { fetchProducts(); }, [fetchProducts]); // auto-carga al montar

  return { products, loading, error, refreshProducts: fetchProducts, updateStock };
}

// ProductGrid.tsx NO sabe nada de fetch, async/await, useState, ni API_BASE_URL.
// Solo consume el hook:
const { products, loading, error, updateStock } = useProducts();
```

---

## 4. Resumen Visual

### Principios SOLID en el Proyecto

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRINCIPIOS SOLID                              │
├───────┬──────────────────────────────────────────────────────────┤
│  SRP  │ Cada archivo tiene UNA responsabilidad:                  │
│       │  • validator.js → solo validar formatos                  │
│       │  • repository.js → solo consultar BD                     │
│       │  • service.js → solo lógica de negocio                   │
│       │  • controller.js → solo manejar HTTP                     │
│       │  • AppError.js → solo representar errores                │
│       │  • response.js → solo dar formato a respuestas           │
├───────┼──────────────────────────────────────────────────────────┤
│  OCP  │ AppError tiene Factory Methods que se EXTIENDEN          │
│       │ sin modificar los existentes.                            │
│       │ Service Factories permiten cambiar el repositorio        │
│       │ sin tocar el servicio.                                   │
├───────┼──────────────────────────────────────────────────────────┤
│  LSP  │ Cualquier objeto que implemente la interfaz del          │
│       │ repositorio puede SUSTITUIR al repositorio real.         │
│       │ AdminGuard y ClientGuard son intercambiables como        │
│       │ wrappers de acceso.                                      │
├───────┼──────────────────────────────────────────────────────────┤
│  ISP  │ Los repositorios exportan SOLO las funciones que         │
│       │ su módulo necesita (auth.repository: 2 funciones).       │
│       │ Las interfaces TypeScript están SEGREGADAS por dominio.  │
├───────┼──────────────────────────────────────────────────────────┤
│  DIP  │ crearServicioAuth(repo), crearServicioClientes(repo),    │
│       │ crearServicioFinanciero(repo): los servicios de alto     │
│       │ nivel dependen de abstracciones (parámetros), no de      │
│       │ implementaciones concretas.                              │
│       │ Los componentes React dependen de hooks (abstractos),    │
│       │ no directamente de localStorage o fetch.                 │
└───────┴──────────────────────────────────────────────────────────┘
```

### Patrones de Diseño en el Proyecto

```
┌────────────────────────────────────────────────────────────────────┐
│                    PATRONES DE DISEÑO                               │
├─────────────────────┬──────────────────────────────────────────────┤
│ Repository          │ auth/ventas/clientes/financiero/productos     │
│                     │ repository.js — abstrae acceso a PostgreSQL   │
├─────────────────────┼──────────────────────────────────────────────┤
│ Factory Method      │ AppError.badRequest(), .notFound(), etc.      │
│                     │ crearServicioAuth(repo) / crearServicio...()  │
├─────────────────────┼──────────────────────────────────────────────┤
│ DTO + Mapper        │ mapearUsuarioAutenticado() en auth.service     │
│                     │ mapearCliente() + mapearHistorial() en        │
│                     │ clientes.service                              │
│                     │ adaptación BackendProduct→Product en          │
│                     │ useProducts.ts                                │
├─────────────────────┼──────────────────────────────────────────────┤
│ Singleton           │ db.js — Pool de conexiones PostgreSQL,        │
│                     │ una sola instancia en toda la app             │
├─────────────────────┼──────────────────────────────────────────────┤
│ Observer            │ AuthContext.tsx — React Context + useState     │
│                     │ + window.addEventListener('storage')          │
├─────────────────────┼──────────────────────────────────────────────┤
│ Facade              │ service.confirmarPedido() oculta: SP, mapeo,  │
│                     │ envío de 2 correos. useCart.confirmOrder()    │
│                     │ oculta: sync BD, crear pedido, limpiar carrito│
├─────────────────────┼──────────────────────────────────────────────┤
│ Chain of            │ Middleware chain en server.js: cors → json →  │
│ Responsibility      │ logger → rutas → 404 → error handler         │
├─────────────────────┼──────────────────────────────────────────────┤
│ Guard               │ AdminGuard.tsx y ClientGuard.tsx — protegen   │
│                     │ secciones según el rol del usuario (IdRol)    │
├─────────────────────┼──────────────────────────────────────────────┤
│ Module              │ Cada módulo (auth, ventas, clientes, etc.)    │
│                     │ encapsula su estado interno y expone solo     │
│                     │ su interfaz pública vía module.exports        │
├─────────────────────┼──────────────────────────────────────────────┤
│ Custom Hook         │ useCart, useProducts, useClients, useFinances │
│                     │ — separan lógica de negocio de componentes UI │
└─────────────────────┴──────────────────────────────────────────────┘
```

---

## 5. Flujo Completo de una Petición (Ejemplo: Login)

Para entender cómo todos los principios y patrones trabajan juntos, aquí el flujo de `POST /api/auth/login`:

```
1. [server.js]             Middleware chain (Chain of Responsibility):
                           CORS → JSON parser → Logger → authRoutes

2. [auth.routes.js]        Router despacha a ctrl.login

3. [auth.controller.js]    Extrae { email, password } del body.
   (SRP: solo HTTP)        Llama a service.autenticarUsuario(email, password).
                           Usa response.ok() / response.fail() para responder.
                           (Facade: no sabe qué hace el service internamente)

4. [auth.service.js]       Factory Method: fue creado con crearServicioAuth(repo).
   (SRP: solo negocio)     DIP: usa `repo` abstracto, no auth.repository directamente.
   (OCP, LSP, DIP)
                           a. validator.validarLogin() → SRP: delega validación
                           b. repo.buscarUsuarioPorCorreo() → Repository Pattern
                           c. bcrypt.compare() → verifica contraseña
                           d. jwt.sign() → genera token
                           e. mapearUsuarioAutenticado() → DTO Pattern: convierte
                              fila de BD al formato AuthUser del frontend

5. [auth.validator.js]     Valida email y password. Lanza AppError.badRequest()
   (SRP: solo validar)     si algo falla. (Factory Method de AppError)

6. [auth.repository.js]    Ejecuta el SQL:
   (SRP: solo datos)       SELECT u.*, r.NombreRol, c.IdCliente FROM Usuario u
   (Repository Pattern)    INNER JOIN Rol r ON ... LEFT JOIN Cliente c ON ...
                           WHERE u.CorreoElectronico = $1

7. [db.js]                 Pool Singleton ejecuta la consulta en PostgreSQL.
   (Singleton)

8. Respuesta al cliente:   { ok: true, data: { idUsuario, nombreUsuario, token, ... } }
   (response.js helpers)

FRONTEND (después de recibir la respuesta):
9. [auth.ts service]       Recibe el AuthUser del API
10. [AuthContext.tsx]       setCurrentUser(user) → Observer: todos los componentes
    (Observer Pattern)      suscritos a useAuth() se actualizan automáticamente
11. [Navbar, Guards, etc.] Se re-renderizan con el nuevo estado de sesión
    (Guard Pattern)
```

---

## 6. Conclusión

El proyecto aplica consistentemente los principios SOLID y varios patrones de diseño de la industria:

- **La separación de capas** (routes → controller → service → repository) implementa SRP de forma sistemática en los 5 módulos.
- **El patrón Factory de Servicios** (`crearServicio*(repo)`) es la implementación más sofisticada del DIP, permitiendo pruebas unitarias sin base de datos.
- **El patrón Repository** con Stored Procedures de PostgreSQL centraliza la lógica de datos y protege la integridad transaccional.
- **Los DTOs/Mappers** resuelven la brecha entre el modelo relacional (PostgreSQL, español, snake_case) y el modelo del frontend (TypeScript, inglés, camelCase).
- **React Context + Custom Hooks** implementan Observer y Facade en el frontend, manteniendo los componentes UI limpios y sin lógica de negocio.

---

