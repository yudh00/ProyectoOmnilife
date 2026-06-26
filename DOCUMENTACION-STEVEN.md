# Documentación de Módulos — Steven Alvarado

Este documento describe los módulos desarrollados por Steven Alvarado Guzmán dentro del proyecto Omnilife Store. Incluye descripción funcional, arquitectura por capas, endpoints REST y componentes de frontend.

---

## Tabla de Contenidos

1. [server.js — Punto de Entrada del API](#1-serverjs--punto-de-entrada-del-api)
2. [Módulo Ventas / Catálogo](#2-módulo-ventas--catálogo)
3. [Módulo Productos (Administración)](#3-módulo-productos-administración)
4. [Servicio de Correo Electrónico](#4-servicio-de-correo-electrónico)
5. [Frontend — ProductFormModal](#5-frontend--productformmodal)
6. [Frontend — ProductCard](#6-frontend--productcard)

---

## 1. `server.js` — Punto de Entrada del API

**Archivo:** `server.js`

Servidor Express principal que actúa como punto de entrada único de la API REST. Registra todos los módulos del sistema y aplica los middlewares globales.

### Responsabilidades

- Inicializar la aplicación Express.
- Aplicar CORS, parseo de JSON y log básico de peticiones.
- Registrar las rutas de cada módulo bajo su prefijo `/api/...`.
- Exponer un endpoint de health check (`GET /api/health`) que verifica la conexión a la base de datos.
- Manejar rutas no encontradas (404) y errores no capturados (500).
- Cerrar el pool de conexiones limpiamente al recibir `SIGINT`.

### Módulos registrados

| Prefijo               | Módulo         |
|-----------------------|----------------|
| `/api/auth`           | Autenticación  |
| `/api/ventas`         | Ventas/Catálogo |
| `/api/clientes`       | Clientes       |
| `/api/financiero`     | Financiero     |
| `/api/productos`      | Productos      |

### Endpoint de salud

```
GET /api/health
Respuesta: { ok: true, hora: "<timestamp UTC>" }
```

---

## 2. Módulo Ventas / Catálogo

**Directorio:** `src/ventas/`

Módulo central del flujo de compra. Gestiona el catálogo de productos, el carrito de compras, los pedidos y el inventario. Sigue una arquitectura de cuatro capas.

### Arquitectura

```
ventas.routes.js  →  ventas.controller.js  →  ventas.service.js  →  ventas.repository.js
    (HTTP)                (adaptador HTTP)         (lógica negocio)       (acceso a BD)
```

### 2.1 Rutas — `ventas.routes.js`

Define todos los endpoints REST del módulo.

#### Catálogo

| Método | Ruta                              | Descripción                                        |
|--------|-----------------------------------|----------------------------------------------------|
| GET    | `/api/ventas/catalogo`            | Lista todos los productos activos                  |
| GET    | `/api/ventas/catalogo?idCategoria=N` | Filtra por categoría                            |
| GET    | `/api/ventas/catalogo?busqueda=X` | Búsqueda por nombre de producto                    |
| GET    | `/api/ventas/categorias`          | Lista todas las categorías disponibles             |
| GET    | `/api/ventas/productos/:id`       | Detalle completo de un producto por ID             |

#### Carrito

| Método | Ruta                                          | Body                                      | Descripción                      |
|--------|-----------------------------------------------|-------------------------------------------|----------------------------------|
| GET    | `/api/ventas/carrito/:idCliente`              | —                                         | Obtiene el carrito del cliente   |
| POST   | `/api/ventas/carrito`                         | `{ idCliente, idProducto, cantidad }`     | Agrega un producto al carrito    |
| DELETE | `/api/ventas/carrito/:idCarrito/productos/:idProducto` | —                               | Elimina un producto del carrito  |

#### Pedidos

| Método | Ruta                                      | Body / Query          | Descripción                                 |
|--------|-------------------------------------------|-----------------------|---------------------------------------------|
| POST   | `/api/ventas/pedidos`                     | `{ idCliente, idCarrito, impuestoPct? }` | Confirma el pedido y vacía el carrito |
| GET    | `/api/ventas/pedidos/cliente/:idCliente`  | —                     | Lista pedidos de un cliente                 |
| GET    | `/api/ventas/pedidos/admin`               | `?idEstado=N`         | Lista todos los pedidos (vista admin)       |
| GET    | `/api/ventas/pedidos/:idPedido`           | —                     | Detalle de un pedido específico             |
| PATCH  | `/api/ventas/pedidos/:idPedido/estado`    | `{ idEstado }`        | Cambia el estado de un pedido               |

#### Inventario

| Método | Ruta                                      | Body          | Descripción                                        |
|--------|-------------------------------------------|---------------|----------------------------------------------------|
| GET    | `/api/ventas/inventario/stock-bajo`       | —             | Productos por debajo del stock mínimo              |
| PUT    | `/api/ventas/inventario/:idProducto/stock` | `{ delta: 1 }` | Incrementa (+1) o decrementa (-1) el stock        |

### 2.2 Controlador — `ventas.controller.js`

Capa de presentación HTTP. Cada función:
- Extrae parámetros de `req.params`, `req.query` o `req.body`.
- Delega el procesamiento al `service`.
- Formatea y devuelve la respuesta JSON (`{ ok: true, data: ... }` o `{ ok: false, error: ... }`).
- No contiene lógica de negocio.

La función auxiliar `manejarError(res, err)` centraliza el manejo de errores y respeta el campo `err.status` para devolver el código HTTP correcto.

### 2.3 Servicio — `ventas.service.js`

Capa de lógica de negocio. Valida entradas, aplica reglas de dominio y orquesta llamadas al repositorio.

| Función               | Descripción                                                                 |
|-----------------------|-----------------------------------------------------------------------------|
| `listarCatalogo`      | Valida filtros y obtiene el catálogo                                        |
| `listarCategorias`    | Retorna todas las categorías                                                |
| `obtenerProducto`     | Valida ID y lanza 404 si no existe                                          |
| `verCarrito`          | Calcula subtotal y cantidad total de ítems                                  |
| `agregarAlCarrito`    | Valida cantidad > 0 y maneja error 409 si hay stock insuficiente            |
| `quitarDelCarrito`    | Lanza 404 si el ítem no existe en el carrito                                |
| `confirmarPedido`     | Crea el pedido y dispara el envío de correos en background (fire-and-forget) |
| `listarPedidosDeCliente` | Lista pedidos por cliente                                              |
| `listarPedidosParaAdmin` | Lista pedidos con filtro opcional por estado                           |
| `verDetallePedido`    | Agrupa líneas de pedido bajo un objeto estructurado con cabecera y líneas   |
| `cambiarEstadoPedido` | Valida respuesta del SP y lanza 400 si la transición no es válida           |
| `consultarStockBajo`  | Delega directamente al repositorio                                          |
| `modificarStock`      | Valida ID y lanza 400 si el stock no pudo actualizarse                      |

**Nota sobre confirmación de pedido:** Al confirmar un pedido, los correos se envían de forma asíncrona sin bloquear la respuesta HTTP. Si el envío falla, el error se registra en consola pero el pedido ya fue creado.

### 2.4 Repositorio — `ventas.repository.js`

Capa de acceso a datos. Invoca Stored Procedures de la base de datos PostgreSQL. No contiene lógica de negocio.

| Función                    | SP / SQL invocado                          |
|----------------------------|--------------------------------------------|
| `obtenerCatalogo`          | `sp_obtener_catalogo($1, $2)`              |
| `obtenerCategorias`        | `sp_obtener_categorias()`                  |
| `obtenerProductoPorId`     | `sp_obtener_producto_por_id($1)`           |
| `validarStock`             | `sp_validar_stock($1, $2)`                 |
| `obtenerCarrito`           | `sp_obtener_carrito($1)`                   |
| `agregarACarrito`          | `sp_agregar_a_carrito($1, $2, $3)`         |
| `eliminarProductoCarrito`  | `sp_eliminar_producto_carrito($1, $2)`     |
| `crearPedido`              | `sp_crear_pedido($1, $2, $3)`              |
| `listarPedidosCliente`     | `sp_listar_pedidos_cliente($1)`            |
| `listarPedidosAdmin`       | `sp_listar_pedidos_admin($1)`              |
| `obtenerDetallePedido`     | `sp_obtener_detalle_pedido($1)`            |
| `actualizarEstadoPedido`   | `sp_actualizar_estado_pedido($1, $2)`      |
| `obtenerDatosCorreoPedido` | Query SQL directo (JOIN Pedido → Usuario → LineaDePedido → Producto) |
| `obtenerAdminPrincipal`    | Query SQL directo (Usuario WHERE IdRol = 1) |
| `obtenerProductosStockBajo`| `sp_obtener_productos_stock_bajo()`        |
| `actualizarStockProducto`  | UPDATE Inventario con guarda `(stock + delta) >= 0` |

---

## 3. Módulo Productos (Administración)

**Directorio:** `src/productos/`

Módulo de administración del catálogo. Permite a los administradores crear, editar y eliminar productos con soporte de imagen. Las imágenes se almacenan localmente en `Presentation/public/images/`.

### 3.1 Rutas — `productos.routes.js`

Configura Multer para recibir imágenes via `multipart/form-data`.

**Configuración de Multer:**
- **Destino:** `Presentation/public/images/`
- **Nombre de archivo:** `producto_<timestamp>.<ext>`
- **Límite:** 5 MB por imagen
- **Filtro:** solo tipos `image/*`

| Método | Ruta                  | Tipo de body          | Descripción                        |
|--------|-----------------------|-----------------------|------------------------------------|
| GET    | `/api/productos/:id`  | —                     | Detalle completo del producto para precargar el formulario de edición |
| POST   | `/api/productos`      | `multipart/form-data` | Crea un nuevo producto             |
| PUT    | `/api/productos/:id`  | `multipart/form-data` | Edita un producto existente        |
| DELETE | `/api/productos/:id`  | —                     | Elimina un producto                |

**Campos del formulario (POST/PUT):**

| Campo        | Tipo   | Requerido | Descripción                        |
|--------------|--------|-----------|------------------------------------|
| `nombre`     | string | Sí        | Nombre del producto                |
| `descripcion`| string | No        | Descripción del producto           |
| `costoCompra`| number | Sí        | Costo de compra en colones         |
| `precioVenta`| number | Sí        | Precio de venta en colones         |
| `idEstado`   | number | Sí        | 1=Disponible, 2=Agotado, 3=Descontinuado |
| `cantidad`   | number | No        | Cantidad inicial en inventario (default 0) |
| `minimo`     | number | No        | Stock mínimo de alerta (default 0) |
| `idCategoria`| number | No        | ID de la categoría del producto    |
| `imagen`     | file   | No        | Imagen del producto (max 5 MB)     |

### 3.2 Controlador — `productos.controller.js`

Parsea los campos del `multipart/form-data`, construye la ruta de imagen (`/images/<filename>`) si se adjunta archivo, y delega al service. En edición solo pasa al service los campos que fueron enviados (no sobreescribe con `undefined`).

### 3.3 Servicio — `productos.service.js`

Aplica validaciones de negocio antes de llamar al repositorio:

| Función          | Validaciones                                                             |
|------------------|--------------------------------------------------------------------------|
| `obtenerProducto`| Verifica ID entero válido; lanza 404 si no existe                        |
| `agregarProducto`| Verifica nombre, precios > 0 y estado válido                             |
| `editarProducto` | Verifica que exista el producto; lanza 404 si no; retorna el producto actualizado |
| `eliminarProducto`| Verifica existencia; lanza 404 si no existe                             |

### 3.4 Repositorio — `productos.repository.js`

Acceso a datos con SQL parametrizado. La creación usa una **transacción** para garantizar que `Producto`, `Inventario` y `Categoria_Producto` se inserten como una unidad atómica; si cualquier inserción falla, se hace `ROLLBACK` completo.

| Función                 | Operación                                                              |
|-------------------------|------------------------------------------------------------------------|
| `obtenerProductoCompleto` | SELECT con JOIN a Inventario y Categoria_Producto                    |
| `crearProducto`          | BEGIN → INSERT Producto → INSERT Inventario → INSERT Categoria_Producto (si aplica) → COMMIT |
| `actualizarProducto`     | UPDATE dinámico: solo actualiza los campos enviados                   |
| `eliminarProducto`       | DELETE por ID; retorna `true` si se eliminó al menos una fila         |

---

## 4. Servicio de Correo Electrónico

**Archivo:** `src/utils/email.service.js`

Servicio utilitario que envía correos HTML transaccionales usando Nodemailer al momento de confirmar un pedido.

### Funciones

#### `enviarConfirmacionCliente({ correo, nombre, numeroPedido, total, items })`

Envía un correo al cliente con el resumen del pedido: número de pedido, tabla de productos y total.

#### `enviarNotificacionAdmin({ correoAdmin, nombreAdmin, numeroPedido, nombreCliente, total, items })`

Notifica al administrador principal que se recibió un nuevo pedido, incluyendo el nombre del cliente y el detalle de los ítems.

### Variables de entorno requeridas

| Variable       | Descripción                              |
|----------------|------------------------------------------|
| `EMAIL_HOST`   | Servidor SMTP (ej. `smtp.gmail.com`)     |
| `EMAIL_PORT`   | Puerto SMTP (ej. `587`)                  |
| `EMAIL_USER`   | Cuenta de correo remitente               |
| `EMAIL_PASS`   | Contraseña o App Password de la cuenta  |
| `EMAIL_FROM`   | Dirección "From" del correo             |

### Integración con el flujo de pedidos

El servicio es invocado desde `ventas.service.js` dentro de `confirmarPedido`. Los correos se envían de forma asíncrona (fire-and-forget) con `.catch()` para que un fallo en el envío no afecte la respuesta al cliente.

---

## 5. Frontend — `ProductFormModal`

**Archivo:** `Presentation/src/components/products/ProductFormModal.tsx`

Modal de React que permite crear o editar un producto. Opera en dos modos según la prop `productId`.

### Props

| Prop        | Tipo               | Descripción                                    |
|-------------|--------------------|------------------------------------------------|
| `isOpen`    | `boolean`          | Controla la visibilidad del modal              |
| `productId` | `number \| null`   | `null` = modo crear; número = modo editar      |
| `onClose`   | `() => void`       | Callback al cerrar el modal                    |
| `onSaved`   | `() => void`       | Callback al guardar con éxito (refresca lista) |

### Comportamiento por modo

**Modo Crear (`productId` es `null`):**
- El formulario inicia vacío.
- Al guardar, hace `POST /api/productos` con `multipart/form-data`.

**Modo Editar (`productId` tiene un número):**
- Al abrir el modal, hace `GET /api/productos/:id` y precarga todos los campos del formulario.
- Muestra un spinner durante la carga de datos.
- Si el producto tiene imagen, la muestra como preview.
- Al guardar, hace `PUT /api/productos/:id` con `multipart/form-data`.

### Campos del formulario

| Campo                  | Validación                     |
|------------------------|--------------------------------|
| Imagen del producto    | Opcional; tipos `image/*`       |
| Nombre del producto    | Requerido                      |
| Descripción            | Opcional                       |
| Costo de compra (₡)    | Requerido; debe ser > 0         |
| Precio de venta (₡)    | Requerido; debe ser > 0         |
| Cantidad en inventario | Opcional; default 0            |
| Stock mínimo           | Opcional; default 0            |
| Estado                 | Select: Disponible / Agotado / Descontinuado |
| Categoría              | Select cargado dinámicamente desde `/api/ventas/categorias` |

### Estados de UI

| Estado         | Descripción                                              |
|----------------|----------------------------------------------------------|
| `loadingData`  | Spinner centrado mientras se cargan datos en modo editar |
| `submitting`   | Botón de guardar deshabilitado con spinner               |
| `serverError`  | Mensaje de error en rojo dentro del modal                |
| `errors`       | Errores por campo mostrados bajo cada input              |

---

## 6. Frontend — `ProductCard`

**Archivo:** `Presentation/src/components/catalog/ProductCard.tsx`

Tarjeta de producto del catálogo. Su contenido varía según si el usuario autenticado es administrador o cliente.

### Props

| Prop           | Tipo                                    | Descripción                               |
|----------------|-----------------------------------------|-------------------------------------------|
| `product`      | `Product`                               | Datos del producto                        |
| `isAdmin`      | `boolean`                               | Determina qué controles se muestran       |
| `onAddToCart`  | `(product: Product) => void`            | Callback para agregar al carrito (cliente)|
| `onUpdateStock`| `(productId: number, delta: number) => void` | Callback para ajustar stock (admin)  |
| `onEdit`       | `(productId: number) => void`           | Callback para abrir el modal de edición (admin) |

### Vista Admin (`isAdmin = true`)

- Muestra un control de stock con botones `+` y `−` que llaman a `onUpdateStock(id, +1)` u `onUpdateStock(id, -1)`.
- Muestra el stock actual en el centro del control.
- Muestra el botón **"Editar producto"** que abre el `ProductFormModal` en modo editar.

### Vista Cliente (`isAdmin = false`)

- Muestra el botón **"Añadir al Carrito"** que llama a `onAddToCart`.
- Si el stock es 0, el botón se reemplaza por **"Agotado"** (deshabilitado) y se superpone un overlay sobre la imagen.

### Elementos visuales comunes

- Badge de categoría en la esquina superior izquierda de la imagen.
- Precio en colones con formato `es-CR`.
- Overlay "AGOTADO" cuando `stock === 0`.
- Imagen lazy-loaded con `object-cover`.

---

## Resumen de archivos por módulo

| Módulo              | Archivos                                                                   |
|---------------------|----------------------------------------------------------------------------|
| Servidor            | `server.js`                                                                |
| Ventas/Catálogo     | `src/ventas/routes/ventas.routes.js`                                       |
|                     | `src/ventas/controllers/ventas.controller.js`                              |
|                     | `src/ventas/services/ventas.service.js`                                    |
|                     | `src/ventas/repositories/ventas.repository.js`                             |
| Productos           | `src/productos/routes/productos.routes.js`                                 |
|                     | `src/productos/controllers/productos.controller.js`                        |
|                     | `src/productos/services/productos.service.js`                              |
|                     | `src/productos/repositories/productos.repository.js`                       |
| Correo              | `src/utils/email.service.js`                                               |
| Frontend            | `Presentation/src/components/products/ProductFormModal.tsx`                |
|                     | `Presentation/src/components/catalog/ProductCard.tsx`                      |
