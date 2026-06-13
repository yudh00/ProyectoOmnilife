# Módulo Catálogo y Ventas — Omnilife Store

Backend del módulo de ventas. Sigue arquitectura por capas:

```
src/modules/ventas/
├── repositories/        ← acceso a datos (llama a SPs de PostgreSQL)
│   └── ventas.repository.js
├── services/            ← lógica de negocio y validaciones
│   └── ventas.service.js
├── controllers/         ← maneja request/response HTTP
│   └── ventas.controller.js
└── routes/              ← define endpoints REST
    └── ventas.routes.js
```

Los SPs están en `data/sp/01_sp_catalogo_ventas.sql`.

## Instalación

```bash
# Instalar Express (es nueva dependencia)
npm install express

# Ejecutar SPs en la BD (si usás psql)
psql -U postgres -d ProyectoIngeneria -f data/sp/01_sp_catalogo_ventas.sql

# Levantar el servidor
node server.js
# o con nodemon:
nodemon server.js
```

## Variables de entorno necesarias (en `.env`)

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ProyectoIngeneria
DB_USER=postgres
DB_PASSWORD=tu_password
PORT=3000
```

## Endpoints disponibles

### Catálogo

| Método | URL | Descripción |
|---|---|---|
| GET | `/api/ventas/catalogo` | Lista productos. Acepta `?idCategoria=X` y `?busqueda=texto` |
| GET | `/api/ventas/categorias` | Lista categorías |
| GET | `/api/ventas/productos/:id` | Detalle de un producto |

### Carrito

| Método | URL | Descripción |
|---|---|---|
| GET | `/api/ventas/carrito/:idCliente` | Ver carrito del cliente |
| POST | `/api/ventas/carrito` | Agregar producto al carrito |
| DELETE | `/api/ventas/carrito/:idCarrito/productos/:idProducto` | Quitar producto |

### Pedidos

| Método | URL | Descripción |
|---|---|---|
| POST | `/api/ventas/pedidos` | Confirmar pedido desde el carrito |
| GET | `/api/ventas/pedidos/cliente/:idCliente` | Historial del cliente |
| GET | `/api/ventas/pedidos/admin` | Bandeja de la admin. Acepta `?idEstado=X` |
| GET | `/api/ventas/pedidos/:idPedido` | Detalle del pedido |
| PATCH | `/api/ventas/pedidos/:idPedido/estado` | Cambiar estado del pedido |

### Inventario

| Método | URL | Descripción |
|---|---|---|
| GET | `/api/ventas/inventario/stock-bajo` | Productos en o bajo el mínimo |

## Ejemplos de uso (cURL)

```bash
# Ver catálogo completo
curl http://localhost:3000/api/ventas/catalogo

# Buscar productos
curl "http://localhost:3000/api/ventas/catalogo?busqueda=magnus"

# Filtrar por categoría
curl "http://localhost:3000/api/ventas/catalogo?idCategoria=2"

# Agregar al carrito
curl -X POST http://localhost:3000/api/ventas/carrito \
  -H "Content-Type: application/json" \
  -d '{"idCliente": 1, "idProducto": 5, "cantidad": 2}'

# Confirmar pedido
curl -X POST http://localhost:3000/api/ventas/pedidos \
  -H "Content-Type: application/json" \
  -d '{"idCliente": 1, "idCarrito": 1}'

# Ver pedidos del cliente
curl http://localhost:3000/api/ventas/pedidos/cliente/1

# Cambiar estado de pedido
curl -X PATCH http://localhost:3000/api/ventas/pedidos/1/estado \
  -H "Content-Type: application/json" \
  -d '{"idEstado": 5}'

# Stock bajo
curl http://localhost:3000/api/ventas/inventario/stock-bajo
```

## Trazabilidad con Historias de Usuario

| Endpoint | HU | RF |
|---|---|---|
| GET /catalogo | HU-11, HU-12 | RF-05 |
| GET /categorias | HU-12 | RF-05 |
| POST /carrito | HU-13 | RF-06 |
| GET /carrito/:id | HU-13 | RF-06 |
| POST /pedidos | HU-14, HU-16, HU-17, HU-20, HU-28 | RF-06, RF-07, RF-08 |
| PATCH /pedidos/:id/estado | HU-15 | RF-06 |
| GET /inventario/stock-bajo | HU-18 | RF-13 |

## Stored Procedures implementados

Todos en PostgreSQL (`data/sp/01_sp_catalogo_ventas.sql`):

1. `sp_obtener_catalogo(idCategoria, busqueda)` — Catálogo con filtros
2. `sp_obtener_categorias()` — Lista de categorías
3. `sp_obtener_producto_por_id(id)` — Detalle del producto
4. `sp_validar_stock(id, cantidad)` — Verifica disponibilidad
5. `sp_crear_pedido(idCliente, idCarrito, impuestoPct)` — Confirma pedido transaccional
6. `sp_listar_pedidos_cliente(id)` — Historial de cliente
7. `sp_obtener_detalle_pedido(id)` — Cabecera + líneas
8. `sp_listar_pedidos_admin(idEstado?)` — Bandeja admin
9. `sp_actualizar_estado_pedido(id, nuevoEstado)` — Cambio de estado validado
10. `sp_obtener_productos_stock_bajo()` — Alertas de inventario
11. `sp_agregar_a_carrito(idCliente, idProducto, cantidad)` — Agregar al carrito
12. `sp_obtener_carrito(idCliente)` — Ver carrito
13. `sp_eliminar_producto_carrito(idCarrito, idProducto)` — Quitar del carrito

## Reglas de negocio aplicadas

El SP `sp_crear_pedido` aplica todo esto en una sola transacción:

- Verifica que el carrito tenga items
- Valida stock de TODOS los productos antes de iniciar (HU-17)
- Calcula subtotal, impuestos (13% IVA por defecto) y total
- Crea cabecera y líneas con **precio congelado** (no afectado por cambios futuros)
- Rebaja inventario automáticamente (HU-16)
- Vacía el carrito (borrado lógico con `IsEliminado`)
- Registra el ingreso en MovimientoCaja (HU-20)
- Genera número de pedido legible: `PED-2026-000001`

Si algo falla, todo se revierte (atomicidad ACID, RNF-05).

El SP `sp_actualizar_estado_pedido` aplica la máquina de estados:

- Pendiente → Pagado → Enviado → Entregado
- Pendiente o Pagado → Cancelado (devuelve stock al inventario)
- Entregado es estado terminal
