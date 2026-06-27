-- =====================================================================
-- STORED PROCEDURES Y FUNCIONES - MODULO CATALOGO Y VENTAS
-- Proyecto Omnilife Store
-- BD: PostgreSQL
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. FUNCION: sp_obtener_catalogo
-- Devuelve productos disponibles con su stock y categorias.
-- Permite filtros opcionales por categoria y por texto en el nombre.
-- HU-11, HU-12
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_obtener_catalogo(
    p_id_categoria INT DEFAULT NULL,
    p_busqueda VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    IdProducto INT,
    NombreProducto VARCHAR,
    DescripcionProducto VARCHAR,
    ImagenProducto VARCHAR,
    PrecioVentaProducto NUMERIC,
    Stock INT,
    Estado VARCHAR,
    Categorias TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.IdProducto,
        p.NombreProducto,
        p.DescripcionProducto,
        p.ImagenProducto,
        p.PrecioVentaProducto,
        COALESCE(i.CantidadInventarioProducto, 0) AS Stock,
        e.Estado,
        STRING_AGG(c.NombreCategoria, ', ') AS Categorias
    FROM Producto p
    INNER JOIN Estado e ON p.EstadoProducto = e.IdEstado
    LEFT JOIN Inventario i ON p.IdProducto = i.IdProducto
    LEFT JOIN Categoria_Producto cp ON p.IdProducto = cp.IdProducto
    LEFT JOIN Categoria c ON cp.IdCategoria = c.IdCategoria
    WHERE 
        e.Estado IN ('Disponible', 'Agotado')
        AND (p_id_categoria IS NULL OR cp.IdCategoria = p_id_categoria)
        AND (p_busqueda IS NULL OR LOWER(p.NombreProducto) LIKE '%' || LOWER(p_busqueda) || '%')
    GROUP BY p.IdProducto, e.Estado, i.CantidadInventarioProducto
    ORDER BY p.NombreProducto;
END;
$$;


-- ---------------------------------------------------------------------
-- 2. FUNCION: sp_obtener_categorias
-- Devuelve todas las categorias para filtros del catalogo.
-- HU-12
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_obtener_categorias()
RETURNS TABLE (
    IdCategoria INT,
    NombreCategoria VARCHAR,
    DescripcionCategoria VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT c.IdCategoria, c.NombreCategoria, c.DescripcionCategoria
    FROM Categoria c
    ORDER BY c.NombreCategoria;
END;
$$;


-- ---------------------------------------------------------------------
-- 3. FUNCION: sp_obtener_producto_por_id
-- Devuelve el detalle completo de un producto especifico.
-- HU-11
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_obtener_producto_por_id(
    p_id_producto INT
)
RETURNS TABLE (
    IdProducto INT,
    NombreProducto VARCHAR,
    DescripcionProducto VARCHAR,
    ImagenProducto VARCHAR,
    PrecioVentaProducto NUMERIC,
    Stock INT,
    Estado VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.IdProducto,
        p.NombreProducto,
        p.DescripcionProducto,
        p.ImagenProducto,
        p.PrecioVentaProducto,
        COALESCE(i.CantidadInventarioProducto, 0) AS Stock,
        e.Estado
    FROM Producto p
    INNER JOIN Estado e ON p.EstadoProducto = e.IdEstado
    LEFT JOIN Inventario i ON p.IdProducto = i.IdProducto
    WHERE p.IdProducto = p_id_producto;
END;
$$;


-- ---------------------------------------------------------------------
-- 4. FUNCION: sp_validar_stock
-- Valida si hay stock suficiente para una cantidad solicitada.
-- Retorna TRUE si hay stock, FALSE si no.
-- HU-17
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_validar_stock(
    p_id_producto INT,
    p_cantidad INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_stock INT;
BEGIN
    SELECT CantidadInventarioProducto INTO v_stock
    FROM Inventario
    WHERE IdProducto = p_id_producto;

    IF v_stock IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN v_stock >= p_cantidad;
END;
$$;


-- ---------------------------------------------------------------------
-- 5. PROCEDURE: sp_crear_pedido
-- Crea un pedido completo desde el carrito del cliente.
-- - Valida stock antes de crear cada linea
-- - Crea cabecera del pedido
-- - Crea las lineas de pedido con precio congelado
-- - Rebaja inventario automaticamente
-- - Registra ingreso en MovimientoCaja
-- - Vacia el carrito (marca productos como eliminados)
-- - Todo es transaccional: si algo falla, hace rollback
-- HU-13, HU-14, HU-16, HU-17, HU-20
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_crear_pedido(
    p_id_cliente INT,
    p_id_carrito INT,
    p_impuesto_pct NUMERIC DEFAULT 13.00
)
RETURNS TABLE (
    IdPedidoGenerado INT,
    NumeroPedido VARCHAR,
    Subtotal NUMERIC,
    Impuestos NUMERIC,
    Total NUMERIC,
    Mensaje TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_pedido INT;
    v_id_estado_pendiente INT;
    v_subtotal NUMERIC := 0;
    v_impuestos NUMERIC := 0;
    v_total NUMERIC := 0;
    v_item RECORD;
    v_precio NUMERIC;
    v_stock_actual INT;
    v_subtotal_linea NUMERIC;
    v_numero_pedido VARCHAR;
BEGIN
    -- Verificar que el carrito tenga items activos
    IF NOT EXISTS (
        SELECT 1 FROM Carrito_Producto 
        WHERE IdCarrito = p_id_carrito AND IsEliminado = FALSE
    ) THEN
        RAISE EXCEPTION 'El carrito esta vacio';
    END IF;

    -- Obtener id del estado "Pendiente"
    SELECT IdEstado INTO v_id_estado_pendiente
    FROM Estado WHERE Estado = 'Pendiente' LIMIT 1;

    -- Validar stock de TODOS los productos del carrito antes de proceder
    FOR v_item IN 
        SELECT cp.IdProducto, cp.Cantidad, p.NombreProducto
        FROM Carrito_Producto cp
        INNER JOIN Producto p ON cp.IdProducto = p.IdProducto
        WHERE cp.IdCarrito = p_id_carrito AND cp.IsEliminado = FALSE
    LOOP
        SELECT CantidadInventarioProducto INTO v_stock_actual
        FROM Inventario WHERE IdProducto = v_item.IdProducto;

        IF v_stock_actual IS NULL OR v_stock_actual < v_item.Cantidad THEN
            RAISE EXCEPTION 'Stock insuficiente para el producto: % (disponible: %, solicitado: %)',
                v_item.NombreProducto, COALESCE(v_stock_actual, 0), v_item.Cantidad;
        END IF;
    END LOOP;

    -- Calcular subtotal sumando precio * cantidad de cada linea
    SELECT COALESCE(SUM(p.PrecioVentaProducto * cp.Cantidad), 0) INTO v_subtotal
    FROM Carrito_Producto cp
    INNER JOIN Producto p ON cp.IdProducto = p.IdProducto
    WHERE cp.IdCarrito = p_id_carrito AND cp.IsEliminado = FALSE;

    -- Calcular impuestos y total
    v_impuestos := ROUND(v_subtotal * (p_impuesto_pct / 100), 2);
    v_total := v_subtotal + v_impuestos;

    -- Crear cabecera del pedido
    INSERT INTO Pedido (IdCliente, FechaPedido, EstadoPedido, Subtotal, Impuestos, Total)
    VALUES (p_id_cliente, (CURRENT_TIMESTAMP AT TIME ZONE 'America/Costa_Rica')::DATE, v_id_estado_pendiente, v_subtotal, v_impuestos, v_total)
    RETURNING IdPedido INTO v_id_pedido;

    -- Crear lineas de pedido y rebajar inventario
    FOR v_item IN 
        SELECT cp.IdProducto, cp.Cantidad, p.PrecioVentaProducto
        FROM Carrito_Producto cp
        INNER JOIN Producto p ON cp.IdProducto = p.IdProducto
        WHERE cp.IdCarrito = p_id_carrito AND cp.IsEliminado = FALSE
    LOOP
        v_precio := v_item.PrecioVentaProducto;
        v_subtotal_linea := v_precio * v_item.Cantidad;

        -- Insertar linea con precio congelado
        INSERT INTO LineaDePedido (IdPedido, IdProducto, Cantidad, PrecioCongelado, Subtotal)
        VALUES (v_id_pedido, v_item.IdProducto, v_item.Cantidad, v_precio, v_subtotal_linea);

        -- Rebajar inventario
        UPDATE Inventario
        SET CantidadInventarioProducto = CantidadInventarioProducto - v_item.Cantidad
        WHERE IdProducto = v_item.IdProducto;
    END LOOP;

    -- Vaciar el carrito (marcar como eliminados)
    UPDATE Carrito_Producto
    SET IsEliminado = TRUE
    WHERE IdCarrito = p_id_carrito AND IsEliminado = FALSE;

    -- Registrar ingreso en MovimientoCaja
    INSERT INTO MovimientoCaja (TipoMovimiento, Monto, Fecha, Concepto)
    VALUES (TRUE, v_total, CURRENT_DATE, 'Venta - Pedido #' || v_id_pedido);

    -- Generar numero de pedido legible (formato PED-AAAA-NNNNNN)
    v_numero_pedido := 'PED-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(v_id_pedido::TEXT, 6, '0');

    RETURN QUERY SELECT v_id_pedido, v_numero_pedido, v_subtotal, v_impuestos, v_total, 
                        'Pedido creado exitosamente'::TEXT;
END;
$$;


-- ---------------------------------------------------------------------
-- 6. FUNCION: sp_listar_pedidos_cliente
-- Lista los pedidos historicos de un cliente especifico.
-- HU-09 (apoyo a Gestion de Clientes)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_listar_pedidos_cliente(
    p_id_cliente INT
)
RETURNS TABLE (
    IdPedido INT,
    NumeroPedido VARCHAR,
    FechaPedido DATE,
    Estado VARCHAR,
    Subtotal NUMERIC,
    Impuestos NUMERIC,
    Total NUMERIC,
    CantidadProductos BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.IdPedido,
        ('PED-' || EXTRACT(YEAR FROM p.FechaPedido) || '-' || LPAD(p.IdPedido::TEXT, 6, '0'))::VARCHAR AS NumeroPedido,
        p.FechaPedido,
        e.Estado,
        p.Subtotal,
        p.Impuestos,
        p.Total,
        (SELECT COUNT(*) FROM LineaDePedido lp WHERE lp.IdPedido = p.IdPedido) AS CantidadProductos
    FROM Pedido p
    INNER JOIN Estado e ON p.EstadoPedido = e.IdEstado
    WHERE p.IdCliente = p_id_cliente
    ORDER BY p.FechaPedido DESC, p.IdPedido DESC;
END;
$$;


-- ---------------------------------------------------------------------
-- 7. FUNCION: sp_obtener_detalle_pedido
-- Devuelve la cabecera y todas las lineas de un pedido.
-- HU-09, HU-14
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_obtener_detalle_pedido(
    p_id_pedido INT
)
RETURNS TABLE (
    IdPedido INT,
    NumeroPedido VARCHAR,
    FechaPedido DATE,
    Estado VARCHAR,
    Subtotal NUMERIC,
    Impuestos NUMERIC,
    Total NUMERIC,
    IdProducto INT,
    NombreProducto VARCHAR,
    Cantidad INT,
    PrecioCongelado NUMERIC,
    SubtotalLinea NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.IdPedido,
        ('PED-' || EXTRACT(YEAR FROM p.FechaPedido) || '-' || LPAD(p.IdPedido::TEXT, 6, '0'))::VARCHAR AS NumeroPedido,
        p.FechaPedido,
        e.Estado,
        p.Subtotal,
        p.Impuestos,
        p.Total,
        prod.IdProducto,
        prod.NombreProducto,
        lp.Cantidad,
        lp.PrecioCongelado,
        lp.Subtotal AS SubtotalLinea
    FROM Pedido p
    INNER JOIN Estado e ON p.EstadoPedido = e.IdEstado
    INNER JOIN LineaDePedido lp ON p.IdPedido = lp.IdPedido
    INNER JOIN Producto prod ON lp.IdProducto = prod.IdProducto
    WHERE p.IdPedido = p_id_pedido
    ORDER BY prod.NombreProducto;
END;
$$;


-- ---------------------------------------------------------------------
-- 8. FUNCION: sp_listar_pedidos_admin
-- Lista todos los pedidos para la bandeja de la administradora.
-- Permite filtrar por estado.
-- HU-15 (apoyo a notificacion de nuevos pedidos)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_listar_pedidos_admin(
    p_id_estado INT DEFAULT NULL
)
RETURNS TABLE (
    IdPedido INT,
    NumeroPedido VARCHAR,
    IdCliente INT,
    NombreCliente TEXT,
    FechaPedido DATE,
    Estado VARCHAR,
    Total NUMERIC,
    CantidadProductos BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.IdPedido,
        ('PED-' || EXTRACT(YEAR FROM p.FechaPedido) || '-' || LPAD(p.IdPedido::TEXT, 6, '0'))::VARCHAR AS NumeroPedido,
        p.IdCliente,
        (u.NombreUsuario || ' ' || u.ApellidosUsuario)::TEXT AS NombreCliente,
        p.FechaPedido,
        e.Estado,
        p.Total,
        (SELECT COUNT(*) FROM LineaDePedido lp WHERE lp.IdPedido = p.IdPedido) AS CantidadProductos
    FROM Pedido p
    INNER JOIN Estado e ON p.EstadoPedido = e.IdEstado
    INNER JOIN Cliente c ON p.IdCliente = c.IdCliente
    LEFT JOIN Usuario u ON c.IdCliente = u.IdUsuario
    WHERE (p_id_estado IS NULL OR p.EstadoPedido = p_id_estado)
    ORDER BY p.FechaPedido DESC, p.IdPedido DESC;
END;
$$;


-- ---------------------------------------------------------------------
-- 9. PROCEDURE: sp_actualizar_estado_pedido
-- Cambia el estado de un pedido validando la maquina de estados.
-- Transiciones validas:
--   Pendiente -> Pagado -> Enviado -> Entregado
--   Pendiente -> Cancelado (devuelve stock)
-- HU-15
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_actualizar_estado_pedido(
    p_id_pedido INT,
    p_nuevo_id_estado INT
)
RETURNS TABLE (
    Resultado BOOLEAN,
    Mensaje TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_estado_actual VARCHAR;
    v_estado_nuevo VARCHAR;
    v_linea RECORD;
BEGIN
    -- Obtener estado actual
    SELECT e.Estado INTO v_estado_actual
    FROM Pedido p INNER JOIN Estado e ON p.EstadoPedido = e.IdEstado
    WHERE p.IdPedido = p_id_pedido;

    IF v_estado_actual IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Pedido no encontrado'::TEXT;
        RETURN;
    END IF;

    -- Obtener estado nuevo
    SELECT Estado INTO v_estado_nuevo FROM Estado WHERE IdEstado = p_nuevo_id_estado;

    IF v_estado_nuevo IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Estado destino invalido'::TEXT;
        RETURN;
    END IF;

    -- Validar transiciones permitidas
    IF NOT (
        (v_estado_actual = 'Pendiente' AND v_estado_nuevo IN ('Pagado', 'Cancelado')) OR
        (v_estado_actual = 'Pagado' AND v_estado_nuevo IN ('Enviado', 'Cancelado')) OR
        (v_estado_actual = 'Enviado' AND v_estado_nuevo = 'Entregado')
    ) THEN
        RETURN QUERY SELECT FALSE, 
            ('Transicion invalida: ' || v_estado_actual || ' -> ' || v_estado_nuevo)::TEXT;
        RETURN;
    END IF;

    -- Si se cancela un pedido, devolver stock al inventario
    IF v_estado_nuevo = 'Cancelado' THEN
        FOR v_linea IN 
            SELECT IdProducto, Cantidad FROM LineaDePedido WHERE IdPedido = p_id_pedido
        LOOP
            UPDATE Inventario
            SET CantidadInventarioProducto = CantidadInventarioProducto + v_linea.Cantidad
            WHERE IdProducto = v_linea.IdProducto;
        END LOOP;
    END IF;

    -- Aplicar el cambio
    UPDATE Pedido SET EstadoPedido = p_nuevo_id_estado WHERE IdPedido = p_id_pedido;

    RETURN QUERY SELECT TRUE, 
        ('Estado actualizado de ' || v_estado_actual || ' a ' || v_estado_nuevo)::TEXT;
END;
$$;


-- ---------------------------------------------------------------------
-- 10. FUNCION: sp_obtener_productos_stock_bajo
-- Lista los productos cuyo inventario actual esta en o bajo el minimo.
-- HU-18
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_obtener_productos_stock_bajo()
RETURNS TABLE (
    IdProducto INT,
    NombreProducto VARCHAR,
    StockActual INT,
    StockMinimo INT,
    Diferencia INT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.IdProducto,
        p.NombreProducto,
        i.CantidadInventarioProducto AS StockActual,
        i.InventarioMinimoProducto AS StockMinimo,
        (i.CantidadInventarioProducto - i.InventarioMinimoProducto) AS Diferencia
    FROM Inventario i
    INNER JOIN Producto p ON i.IdProducto = p.IdProducto
    WHERE i.CantidadInventarioProducto <= i.InventarioMinimoProducto
    ORDER BY Diferencia ASC;
END;
$$;


-- ---------------------------------------------------------------------
-- 11. PROCEDURE: sp_agregar_a_carrito
-- Agrega un producto al carrito del cliente o actualiza su cantidad.
-- Si el carrito no existe, lo crea.
-- HU-13
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_agregar_a_carrito(
    p_id_cliente INT,
    p_id_producto INT,
    p_cantidad INT
)
RETURNS TABLE (
    IdCarrito INT,
    Mensaje TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_carrito INT;
    v_stock INT;
    v_existe BOOLEAN;
BEGIN
    -- Validar cantidad
    IF p_cantidad <= 0 THEN
        RAISE EXCEPTION 'La cantidad debe ser mayor a cero';
    END IF;

    -- Validar stock
    SELECT CantidadInventarioProducto INTO v_stock
    FROM Inventario WHERE IdProducto = p_id_producto;

    IF v_stock IS NULL OR v_stock < p_cantidad THEN
        RAISE EXCEPTION 'Stock insuficiente (disponible: %)', COALESCE(v_stock, 0);
    END IF;

    -- Buscar carrito activo del cliente o crear uno nuevo
    SELECT c.IdCarrito INTO v_id_carrito
    FROM Carrito c
    WHERE c.IdCliente = p_id_cliente
    ORDER BY c.FechaCreacion DESC, c.IdCarrito DESC
    LIMIT 1;

    IF v_id_carrito IS NULL THEN
        INSERT INTO Carrito (IdCliente, FechaCreacion)
        VALUES (p_id_cliente, CURRENT_DATE);

        SELECT c.IdCarrito INTO v_id_carrito
        FROM Carrito c
        WHERE c.IdCliente = p_id_cliente
        ORDER BY c.IdCarrito DESC
        LIMIT 1;
    END IF;

    -- Verificar si el producto ya esta en el carrito
    SELECT EXISTS (
        SELECT 1 FROM Carrito_Producto cp
        WHERE cp.IdCarrito = v_id_carrito AND cp.IdProducto = p_id_producto
    ) INTO v_existe;

    IF v_existe THEN
        UPDATE Carrito_Producto
        SET Cantidad = p_cantidad, IsEliminado = FALSE
        WHERE Carrito_Producto.IdCarrito = v_id_carrito AND Carrito_Producto.IdProducto = p_id_producto;
    ELSE
        INSERT INTO Carrito_Producto (IdCarrito, IdProducto, Cantidad, IsEliminado)
        VALUES (v_id_carrito, p_id_producto, p_cantidad, FALSE);
    END IF;

    RETURN QUERY SELECT v_id_carrito, 'Producto agregado al carrito'::TEXT;
END;
$$;


-- ---------------------------------------------------------------------
-- 12. FUNCION: sp_obtener_carrito
-- Devuelve el contenido del carrito activo del cliente con totales.
-- HU-13
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_obtener_carrito(
    p_id_cliente INT
)
RETURNS TABLE (
    IdCarrito INT,
    IdProducto INT,
    NombreProducto VARCHAR,
    ImagenProducto VARCHAR,
    PrecioActual NUMERIC,
    Cantidad INT,
    SubtotalLinea NUMERIC,
    StockDisponible INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_carrito INT;
BEGIN
    SELECT c.IdCarrito INTO v_id_carrito
    FROM Carrito c
    WHERE c.IdCliente = p_id_cliente
    ORDER BY c.FechaCreacion DESC, c.IdCarrito DESC
    LIMIT 1;

    IF v_id_carrito IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        v_id_carrito,
        p.IdProducto,
        p.NombreProducto,
        p.ImagenProducto,
        p.PrecioVentaProducto AS PrecioActual,
        cp.Cantidad,
        (p.PrecioVentaProducto * cp.Cantidad) AS SubtotalLinea,
        COALESCE(i.CantidadInventarioProducto, 0) AS StockDisponible
    FROM Carrito_Producto cp
    INNER JOIN Producto p ON cp.IdProducto = p.IdProducto
    LEFT JOIN Inventario i ON p.IdProducto = i.IdProducto
    WHERE cp.IdCarrito = v_id_carrito AND cp.IsEliminado = FALSE
    ORDER BY p.NombreProducto;
END;
$$;


-- ---------------------------------------------------------------------
-- 13. PROCEDURE: sp_eliminar_producto_carrito
-- Marca como eliminado un producto del carrito (borrado logico).
-- HU-13
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_eliminar_producto_carrito(
    p_id_carrito INT,
    p_id_producto INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE Carrito_Producto
    SET IsEliminado = TRUE
    WHERE IdCarrito = p_id_carrito AND IdProducto = p_id_producto;

    RETURN FOUND;
END;
$$;
