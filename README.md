# Omnilife Store

Plataforma de e-commerce para Omnilife: catálogo de productos, carrito, pedidos, gestión de clientes, módulo financiero y autenticación con roles (Administrador / Cliente).

Proyecto de la asignatura de Ingeniería de Software — backend en Node.js + Express + PostgreSQL, frontend en React + TypeScript + Vite.

## Tabla de contenidos

- [Tecnologías](#tecnologías)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos previos](#requisitos-previos)
- [Instalación](#instalación)
- [Scripts disponibles](#scripts-disponibles)
- [Módulos del backend](#módulos-del-backend)
- [Roles y usuario de prueba](#roles-y-usuario-de-prueba)
- [Páginas principales del frontend](#páginas-principales-del-frontend)
- [Pruebas](#pruebas)
- [Notas y troubleshooting](#notas-y-troubleshooting)

## Tecnologías

**Backend**
- Node.js + Express 5
- PostgreSQL (driver `pg`), toda la lógica de datos vive en Stored Procedures
- `jsonwebtoken` + `bcrypt` para autenticación
- `multer` para subida de imágenes de productos
- `nodemailer` para correos transaccionales de confirmación de pedido

**Frontend**
- React 19 + TypeScript
- Vite + TailwindCSS 4
- Vitest + Testing Library para pruebas de componentes

## Estructura del proyecto

```
ProyectoOmnilife/
├── server.js                  # Punto de entrada del API (registra todos los módulos)
├── init-db.js                 # Crea la BD, tablas, Stored Procedures y el admin semilla
├── .env.example                # Plantilla de variables de entorno
├── data/
│   ├── Script BD and Tablas.sql
│   └── sp/                    # Stored Procedures, en orden de ejecución:
│       ├── 01_sp_catalogo_ventas.sql
│       ├── 02_sp_alteraciones_bd.sql
│       ├── 03_sp_clientes.sql
│       └── sp_modulo_financiero.sql
├── src/                        # Backend, organizado por módulo de dominio
│   ├── auth/                  # routes/controllers/services/repositories/validators
│   ├── ventas/                 # catálogo, carrito, pedidos, inventario
│   ├── clientes/
│   ├── financiero/
│   ├── productos/
│   ├── config/db.js            # Pool de conexión a PostgreSQL
│   └── utils/                  # AppError, response helpers, email.service
└── Presentation/                # Frontend (Vite + React)
    └── src/
        ├── components/          # auth, cart, catalog, clients, finances, orders, products, ui
        ├── hooks/               # useAuth, useCart, useProducts, useClients, useOrders, ...
        ├── context/             # AuthContext
        ├── guards/              # AdminGuard, ClientGuard
        └── types/
```

Cada módulo del backend sigue la misma arquitectura por capas:

```
routes  →  controller  →  service  →  repository  →  Stored Procedure (PostgreSQL)
(HTTP)     (req/res)      (lógica de negocio)   (solo acceso a datos)
```

## Requisitos previos

- [Node.js](https://nodejs.org/) 20 LTS o superior (probado con v24)
- [PostgreSQL](https://www.postgresql.org/) 14 o superior, corriendo localmente
- npm (incluido con Node)

Verifica que los tengas instalados:

```bash
node -v
npm -v
psql --version
```

## Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd ProyectoOmnilife
```

### 2. Backend — instalar dependencias

Desde la raíz del proyecto:

```bash
npm install
npm install bcryptjs
npm install react-hot-toast
```


### 3. Configurar variables de entorno

Copia la plantilla y completa con tus credenciales de PostgreSQL:

```bash
cp .env.example .env
```

Como mínimo necesitas configurar `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD`. `JWT_SECRET`/`JWT_EXPIRES_IN` y las variables `EMAIL_*` son opcionales en desarrollo (ver comentarios dentro de `.env.example`).

### 4. Inicializar la base de datos

Con PostgreSQL corriendo y el `.env` configurado:

```bash
node init-db.js
```

Este script automatiza todo el setup de base de datos:

1. Crea la base de datos (`DB_NAME`, por defecto `ProyectoIngeneria`) si no existe.
2. Crea todas las tablas a partir de `data/Script BD and Tablas.sql`.
3. Inyecta los Stored Procedures en orden: `01_sp_catalogo_ventas.sql` → `02_sp_alteraciones_bd.sql` → `03_sp_clientes.sql` → `sp_modulo_financiero.sql`.
4. Crea un usuario **Administrador** semilla (ver [Roles y usuario de prueba](#roles-y-usuario-de-prueba)).

> Si prefieres correr los scripts manualmente con `psql`, respeta ese mismo orden — `02_sp_alteraciones_bd.sql` agrega la columna `IdUsuario` a `Cliente` que `03_sp_clientes.sql` necesita para funcionar.

`node init-db.js` es idempotente: puedes volver a correrlo sin duplicar datos ni romper nada si la base ya existe.

### 5. Levantar el backend

```bash
node server.js
```

o en modo desarrollo, con reinicio automático al guardar cambios:

```bash
npm run dev
```

El servidor queda en `http://localhost:3000`. Verifica que todo esté bien con:

```bash
curl http://localhost:3000/api/health
```

### 6. Frontend

En una segunda terminal:

```bash
cd Presentation
npm install
npm run dev
```

La app queda en `http://localhost:5173`. Vite hace proxy de las peticiones a `/api` hacia el backend en el puerto 3000 (configurado en `Presentation/vite.config.ts`), así que no hace falta tocar nada más.

> **Importante:** levanta siempre el backend primero y el frontend después.

## Scripts disponibles

### Raíz (backend)

| Comando | Descripción |
|---|---|
| `npm start` | Levanta el servidor (`node server.js`) |
| `npm run dev` | Levanta el servidor con `nodemon` (reinicio automático) |

### `Presentation/` (frontend)

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo de Vite |
| `npm run build` | Type-check (`tsc -b`) + build de producción |
| `npm run preview` | Sirve el build de producción localmente |
| `npm run lint` | Corre ESLint |
| `npm test` | Corre la suite de pruebas con Vitest |
| `npm run test:watch` | Vitest en modo watch |

## Módulos del backend

| Módulo | Prefijo API | Responsabilidad |
|---|---|---|
| Auth | `/api/auth` | Login y registro de clientes (JWT + bcrypt) |
| Ventas | `/api/ventas` | Catálogo, carrito, pedidos, inventario |
| Clientes | `/api/clientes` | CRUD de clientes (admin) + historial de compras |
| Financiero | `/api/financiero` | Ingresos, gastos, flujo de caja, rentabilidad por producto |
| Productos | `/api/productos` | Alta/edición/borrado de productos con imagen (admin) |

Documentación detallada de endpoints, Stored Procedures y reglas de negocio por módulo:
- [`src/ventas/README.md`](src/ventas/README.md) — Catálogo, carrito, pedidos e inventario.
- [`DOCUMENTACION-STEVEN.md`](DOCUMENTACION-STEVEN.md) — server.js, Ventas, Productos, correo, y componentes de frontend relacionados.

## Roles y usuario de prueba

- `IdRol 1` = Administrador, `IdRol 2` = Cliente.
- `node init-db.js` crea un Administrador semilla:
  - **Correo:** `admin@omni.com`
  - **Contraseña:** `admin123`
- Cualquier otra cuenta se crea desde la pantalla de **Registro** del frontend y queda automáticamente como Cliente.

## Páginas principales del frontend

| Página | Quién la ve | Descripción |
|---|---|---|
| Catálogo | Todos | Productos disponibles; admin puede crear/editar/ajustar stock |
| Mis Pedidos | Clientes | Pedidos propios con su estado (Pendiente, Pagado, Enviado, Entregado, Cancelado) y detalle |
| Clientes | Administradores | Directorio de clientes, edición e historial de compras |
| Finanzas | Administradores | Ingresos, gastos, flujo de caja y rentabilidad por producto |
| Pedidos | Administradores | Bandeja de todos los pedidos, cambio de estado y detalle completo |

## Pruebas

- `node pruebas-clientes.js` — pruebas de integración del módulo de Clientes vía HTTP (requiere el backend corriendo en otra terminal).
- Dentro de `Presentation/`: `npm test` — pruebas de componentes con Vitest + Testing Library.

## Notas y troubleshooting

- Las imágenes de productos se guardan físicamente en `Presentation/public/images/` y se sirven como estáticos desde ahí.
- CORS en el backend solo acepta peticiones desde `http://localhost:5173` (configurado en `server.js`); si cambias el puerto del frontend, ajústalo ahí también.
- Si ves `ERR_CONNECTION_REFUSED` en el navegador, casi siempre es que el backend (`node server.js`) no está corriendo — revísalo antes que nada.
- Nunca subas tu `.env` real al repositorio; ya está en `.gitignore`. Usa `.env.example` como referencia para saber qué variables existen.
