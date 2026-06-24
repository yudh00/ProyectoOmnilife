-- Database: ProyectoIngeneria

-- DROP DATABASE IF EXISTS "ProyectoIngeneria";

CREATE DATABASE "ProyectoIngeneria"
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LOCALE_PROVIDER = 'libc'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1
    IS_TEMPLATE = False;

COMMENT ON DATABASE "ProyectoIngeneria"
    IS 'A BD for the Project of the Course Ingeneria where were doing an App of sales for a client';

-- ==========================================
-- 1. ENTIDADES INDEPENDIENTES (Sin llaves foráneas primarias)
-- ==========================================


-- Tabla Estado (Debe crearse primero ya que muchas tablas la referencian)
CREATE TABLE IF NOT EXISTS Estado (
    IdEstado SERIAL PRIMARY KEY,
    Estado VARCHAR(50) NOT NULL,
    DescripcionEstado VARCHAR(255)
);

-- Tabla Usuario
CREATE TABLE IF NOT EXISTS Usuario (
    IdUsuario SERIAL PRIMARY KEY,
    CorreoElectronico VARCHAR(150) UNIQUE NOT NULL, -- UNIQUE cumple la función de CK (Candidate Key)
    NombreUsuario VARCHAR(100) NOT NULL,
    ApellidosUsuario VARCHAR(100) NOT NULL,
    FechaRegistro DATE DEFAULT CURRENT_DATE
);

-- Tabla Categoria
CREATE TABLE IF NOT EXISTS Categoria (
    IdCategoria SERIAL PRIMARY KEY,
    NombreCategoria VARCHAR(100) NOT NULL,
    DescripcionCategoria VARCHAR(255)
);

-- Tabla MovimientoCaja
CREATE TABLE IF NOT EXISTS MovimientoCaja (
    IdMovimiento SERIAL PRIMARY KEY,
    TipoMovimiento BOOLEAN NOT NULL, -- TRUE = Entrada, FALSE = Salida (o viceversa)
    Monto NUMERIC(10,2) NOT NULL,
    Fecha DATE DEFAULT CURRENT_DATE,
    Concepto VARCHAR(255)
);

-- ==========================================
-- 2. ENTIDADES DEPENDIENTES (Con llaves foráneas básicas)
-- ==========================================

-- Tabla Cliente
CREATE TABLE IF NOT EXISTS Cliente (
    IdCliente SERIAL PRIMARY KEY,
    IsActivo BOOLEAN DEFAULT TRUE,
    NotaAsesoria VARCHAR(255)
);

-- Tabla Administrador
CREATE TABLE IF NOT EXISTS Administrador (
    IdAdministrador SERIAL PRIMARY KEY,
    IdUsuario INT NOT NULL,
    FechaIngreso DATE NOT NULL,
    CONSTRAINT fk_administrador_usuario FOREIGN KEY (IdUsuario) REFERENCES Usuario(IdUsuario) ON DELETE CASCADE
);

-- Tabla TelefonoUsuario (Llave primaria compuesta por IdUsuario y el Telefono)
CREATE TABLE IF NOT EXISTS TelefonoUsuario (
    IdUsuario INT,
    TelefonoUsuario VARCHAR(20),
    IsActivo BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (IdUsuario, TelefonoUsuario),
    CONSTRAINT fk_telefono_usuario FOREIGN KEY (IdUsuario) REFERENCES Usuario(IdUsuario) ON DELETE CASCADE
);

-- Tabla Direccion
CREATE TABLE IF NOT EXISTS Direccion (
    IdDireccion SERIAL PRIMARY KEY,
    IdCliente INT NOT NULL,
    Provincia VARCHAR(50) NOT NULL,
    Canton VARCHAR(50) NOT NULL,
    Distrito VARCHAR(50) NOT NULL,
    SennasParticulares VARCHAR(255),
    CONSTRAINT fk_direccion_cliente FOREIGN KEY (IdCliente) REFERENCES Cliente(IdCliente) ON DELETE CASCADE
);

-- Tabla Producto
CREATE TABLE IF NOT EXISTS Producto (
    IdProducto SERIAL PRIMARY KEY,
    NombreProducto VARCHAR(150) NOT NULL,
    DescripcionProducto VARCHAR(255),
    ImagenProducto VARCHAR(255),
    CostoCompraProducto NUMERIC(10,2) NOT NULL,
    PrecioVentaProducto NUMERIC(10,2) NOT NULL,
    EstadoProducto INT NOT NULL, -- Aplica la regla: Referencia a Estado
    CONSTRAINT fk_producto_estado FOREIGN KEY (EstadoProducto) REFERENCES Estado(IdEstado)
);

-- Tabla Inventario
CREATE TABLE IF NOT EXISTS Inventario (
    IdProducto INT PRIMARY KEY, -- Relación 1 a 1 o extensión de Producto
    CantidadInventarioProducto INT NOT NULL DEFAULT 0,
    InventarioMinimoProducto INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_inventario_producto FOREIGN KEY (IdProducto) REFERENCES Producto(IdProducto) ON DELETE CASCADE
);

-- Tabla Carrito
CREATE TABLE IF NOT EXISTS Carrito (
    IdCarrito SERIAL PRIMARY KEY,
    IdCliente INT NOT NULL,
    FechaCreacion DATE DEFAULT CURRENT_DATE,
    CONSTRAINT fk_carrito_cliente FOREIGN KEY (IdCliente) REFERENCES Cliente(IdCliente) ON DELETE CASCADE
);

-- Tabla Pedido (Nota: Cambié el atributo "Id" FK por "IdCliente" para que tenga sentido el flujo del negocio)
CREATE TABLE IF NOT EXISTS Pedido (
    IdPedido SERIAL PRIMARY KEY,
    IdCliente INT NOT NULL, 
    FechaPedido DATE DEFAULT CURRENT_DATE,
    EstadoPedido INT NOT NULL, -- Aplica la regla: Referencia a Estado
    Subtotal NUMERIC(10,2) NOT NULL,
    Impuestos NUMERIC(10,2) NOT NULL,
    Total NUMERIC(10,2) NOT NULL,
    CONSTRAINT fk_pedido_cliente FOREIGN KEY (IdCliente) REFERENCES Cliente(IdCliente),
    CONSTRAINT fk_pedido_estado FOREIGN KEY (EstadoPedido) REFERENCES Estado(IdEstado)
);

-- ==========================================
-- 3. TABLAS INTERMEDIAS (Relaciones Muchos a Muchos)
-- ==========================================

-- Tabla Categoria_Producto
CREATE TABLE IF NOT EXISTS Categoria_Producto (
    IdProducto INT,
    IdCategoria INT,
    PRIMARY KEY (IdProducto, IdCategoria),
    CONSTRAINT fk_catprod_producto FOREIGN KEY (IdProducto) REFERENCES Producto(IdProducto) ON DELETE CASCADE,
    CONSTRAINT fk_catprod_categoria FOREIGN KEY (IdCategoria) REFERENCES Categoria(IdCategoria) ON DELETE CASCADE
);

-- Tabla Carrito_Producto
CREATE TABLE IF NOT EXISTS Carrito_Producto (
    IdCarrito INT,
    IdProducto INT,
    Cantidad INT NOT NULL DEFAULT 1,
    IsEliminado BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (IdCarrito, IdProducto),
    CONSTRAINT fk_carprod_carrito FOREIGN KEY (IdCarrito) REFERENCES Carrito(IdCarrito) ON DELETE CASCADE,
    CONSTRAINT fk_carprod_producto FOREIGN KEY (IdProducto) REFERENCES Producto(IdProducto) ON DELETE CASCADE
);

-- Tabla LineaDePedido
CREATE TABLE IF NOT EXISTS LineaDePedido (
    IdPedido INT,
    IdProducto INT,
    Cantidad INT NOT NULL,
    PrecioCongelado NUMERIC(10,2) NOT NULL, -- Es double, guardado como Numeric
    Subtotal NUMERIC(10,2) NOT NULL,
    PRIMARY KEY (IdPedido, IdProducto),
    CONSTRAINT fk_linea_pedido FOREIGN KEY (IdPedido) REFERENCES Pedido(IdPedido) ON DELETE CASCADE,
    CONSTRAINT fk_linea_producto FOREIGN KEY (IdProducto) REFERENCES Producto(IdProducto)
);


INSERT INTO Estado (Estado, DescripcionEstado) VALUES
('Disponible', 'Producto disponible para la venta'),
('Agotado', 'Producto sin existencias'),
('Descontinuado', 'Producto que ya no se vende'),
('Pendiente', 'Pedido registrado, en espera de pago'),
('Pagado', 'Pedido pagado por el cliente'),
('Enviado', 'Pedido despachado al cliente'),
('Entregado', 'Pedido entregado al cliente'),
('Cancelado', 'Pedido cancelado');


Select * from estado where idEstado = 1