-- =====================================================================
-- STORED PROCEDURES — MÓDULO GESTIÓN DE CLIENTES
-- Proyecto Omnilife Store | BD: PostgreSQL "ProyectoIngeneria"
-- =====================================================================
-- EJECUCIÓN (después de 02_sp_alteraciones_bd.sql):
--   psql -U postgres -d ProyectoIngeneria -f data/sp/03_sp_clientes.sql
-- =====================================================================
-- FUNCIONES:
--   1. sp_listar_clientes        — HU-03, RF-05, RF-07
--   2. sp_obtener_cliente_por_id — HU-03
--   3. sp_crear_cliente          — HU-02, RF-04
--   4. sp_actualizar_cliente     — HU-03, RF-05
--   5. sp_desactivar_cliente     — HU-03, RF-05 (soft delete)
--   6. sp_obtener_historial_cliente — HU-03, RF-06
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. sp_listar_clientes
--    Lista todos los clientes con su teléfono activo y total de pedidos.
--    Búsqueda parcial (type-ahead) por nombre completo, correo o teléfono.
--    HU-03 / RF-07 §6.2
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_listar_clientes(
    p_busqueda VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    IdCliente        INT,
    IdUsuario        INT,
    NombreUsuario    VARCHAR,
    ApellidosUsuario VARCHAR,
    CorreoElectronico VARCHAR,
    TelefonoUsuario  VARCHAR,
    FechaRegistro    DATE,
    IsActivo         BOOLEAN,
    TotalPedidos     BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.IdCliente,
        u.IdUsuario,
        u.NombreUsuario,
        u.ApellidosUsuario,
        u.CorreoElectronico,
        COALESCE(tel.TelefonoUsuario, '')   AS TelefonoUsuario,
        u.FechaRegistro,
        c.IsActivo,
        COUNT(p.IdPedido)                   AS TotalPedidos
    FROM Cliente c
    INNER JOIN Usuario u ON c.IdUsuario = u.IdUsuario
    -- LATERAL: obtiene el primer teléfono activo del usuario (evita duplicados de filas)
    LEFT JOIN LATERAL (
        SELECT t.TelefonoUsuario
        FROM   TelefonoUsuario t
        WHERE  t.IdUsuario = u.IdUsuario AND t.IsActivo = TRUE
        ORDER  BY t.TelefonoUsuario
        LIMIT  1
    ) tel ON TRUE
    LEFT JOIN Pedido p ON c.IdCliente = p.IdCliente
    WHERE
        p_busqueda IS NULL
        OR LOWER(u.NombreUsuario || ' ' || u.ApellidosUsuario) LIKE '%' || LOWER(p_busqueda) || '%'
        OR LOWER(u.CorreoElectronico)                          LIKE '%' || LOWER(p_busqueda) || '%'
        OR tel.TelefonoUsuario                                 LIKE '%' || p_busqueda        || '%'
    GROUP BY
        c.IdCliente, u.IdUsuario, u.NombreUsuario, u.ApellidosUsuario,
        u.CorreoElectronico, tel.TelefonoUsuario, u.FechaRegistro, c.IsActivo
    ORDER BY u.ApellidosUsuario, u.NombreUsuario;
END;
$$;


-- ---------------------------------------------------------------------
-- 2. sp_obtener_cliente_por_id
--    Devuelve el detalle completo de un cliente (incluye NotaAsesoria).
--    Reutilizado internamente por sp_crear_cliente y sp_actualizar_cliente.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_obtener_cliente_por_id(
    p_id_cliente INT
)
RETURNS TABLE (
    IdCliente        INT,
    IdUsuario        INT,
    NombreUsuario    VARCHAR,
    ApellidosUsuario VARCHAR,
    CorreoElectronico VARCHAR,
    TelefonoUsuario  VARCHAR,
    FechaRegistro    DATE,
    IsActivo         BOOLEAN,
    NotaAsesoria     VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.IdCliente,
        u.IdUsuario,
        u.NombreUsuario,
        u.ApellidosUsuario,
        u.CorreoElectronico,
        COALESCE(tel.TelefonoUsuario, '') AS TelefonoUsuario,
        u.FechaRegistro,
        c.IsActivo,
        c.NotaAsesoria
    FROM Cliente c
    INNER JOIN Usuario u ON c.IdUsuario = u.IdUsuario
    LEFT JOIN LATERAL (
        SELECT t.TelefonoUsuario
        FROM   TelefonoUsuario t
        WHERE  t.IdUsuario = u.IdUsuario AND t.IsActivo = TRUE
        ORDER  BY t.TelefonoUsuario
        LIMIT  1
    ) tel ON TRUE
    WHERE c.IdCliente = p_id_cliente;
END;
$$;


-- ---------------------------------------------------------------------
-- 3. sp_crear_cliente
--    Crea el Usuario, el TelefonoUsuario y el Cliente en una sola
--    transacción atómica (ACID — RNF-05).
--    Valida unicidad de correo antes de insertar.
--    HU-02, RF-04
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_crear_cliente(
    p_nombre    VARCHAR,
    p_apellidos VARCHAR,
    p_correo    VARCHAR,
    p_telefono  VARCHAR
)
RETURNS TABLE (
    IdCliente        INT,
    IdUsuario        INT,
    NombreUsuario    VARCHAR,
    ApellidosUsuario VARCHAR,
    CorreoElectronico VARCHAR,
    TelefonoUsuario  VARCHAR,
    FechaRegistro    DATE,
    IsActivo         BOOLEAN,
    NotaAsesoria     VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_usuario INT;
    v_id_cliente INT;
BEGIN
    -- Unicidad del correo (SQLSTATE 23505 = unique_violation)
    -- Alias u_chk evita ambigüedad con la variable OUT CorreoElectronico del RETURNS TABLE
    IF EXISTS (SELECT 1 FROM Usuario u_chk WHERE u_chk.CorreoElectronico = p_correo) THEN
        RAISE EXCEPTION 'El correo % ya está registrado', p_correo
            USING ERRCODE = '23505';
    END IF;

    -- Crear registro en Usuario (IdRol = 2 → Cliente)
    INSERT INTO Usuario (NombreUsuario, ApellidosUsuario, CorreoElectronico, IdRol)
    VALUES (p_nombre, p_apellidos, p_correo, 2)
    RETURNING Usuario.IdUsuario INTO v_id_usuario;

    -- Registrar teléfono principal activo
    INSERT INTO TelefonoUsuario (IdUsuario, TelefonoUsuario, IsActivo)
    VALUES (v_id_usuario, p_telefono, TRUE);

    -- Crear registro en Cliente vinculado al Usuario
    INSERT INTO Cliente (IdUsuario, IsActivo)
    VALUES (v_id_usuario, TRUE)
    RETURNING Cliente.IdCliente INTO v_id_cliente;

    -- Retornar datos completos del nuevo cliente
    RETURN QUERY SELECT * FROM sp_obtener_cliente_por_id(v_id_cliente);
END;
$$;


-- ---------------------------------------------------------------------
-- 4. sp_actualizar_cliente
--    Actualiza Usuario + TelefonoUsuario + estado del Cliente.
--    Valida unicidad del correo excluyendo el propio usuario.
--    Gestión de teléfono: desactiva el anterior y activa el nuevo.
--    HU-03, RF-05
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_actualizar_cliente(
    p_id_cliente INT,
    p_nombre     VARCHAR,
    p_apellidos  VARCHAR,
    p_correo     VARCHAR,
    p_telefono   VARCHAR,
    p_is_activo  BOOLEAN
)
RETURNS TABLE (
    IdCliente        INT,
    IdUsuario        INT,
    NombreUsuario    VARCHAR,
    ApellidosUsuario VARCHAR,
    CorreoElectronico VARCHAR,
    TelefonoUsuario  VARCHAR,
    FechaRegistro    DATE,
    IsActivo         BOOLEAN,
    NotaAsesoria     VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_usuario INT;
BEGIN
    -- Obtener IdUsuario del cliente
    -- Alias c_upd evita ambigüedad con variable OUT IdCliente
    SELECT c_upd.IdUsuario INTO v_id_usuario
    FROM   Cliente c_upd
    WHERE  c_upd.IdCliente = p_id_cliente;

    IF v_id_usuario IS NULL THEN
        RAISE EXCEPTION 'Cliente con id % no encontrado', p_id_cliente;
    END IF;

    -- Unicidad del correo (excluye al propio usuario)
    -- Alias u_chk evita ambigüedad con variables OUT CorreoElectronico e IdUsuario
    IF EXISTS (
        SELECT 1 FROM Usuario u_chk
        WHERE  u_chk.CorreoElectronico = p_correo
        AND    u_chk.IdUsuario != v_id_usuario
    ) THEN
        RAISE EXCEPTION 'El correo % ya está registrado por otro usuario', p_correo
            USING ERRCODE = '23505';
    END IF;

    -- Actualizar datos del Usuario
    -- En UPDATE SET/WHERE, las columnas son siempre de la tabla destino: sin ambigüedad
    UPDATE Usuario
    SET    NombreUsuario     = p_nombre,
           ApellidosUsuario  = p_apellidos,
           CorreoElectronico = p_correo
    WHERE  Usuario.IdUsuario = v_id_usuario;

    -- Gestión del teléfono: desactivar distintos del nuevo
    -- Alias tel_upd evita ambigüedad con variable OUT TelefonoUsuario
    UPDATE TelefonoUsuario AS tel_upd
    SET    IsActivo = FALSE
    WHERE  tel_upd.IdUsuario = v_id_usuario
    AND    tel_upd.TelefonoUsuario != p_telefono;

    -- Activar el nuevo teléfono (UPDATE primero, INSERT si no existe).
    -- Se evita ON CONFLICT (col1, col2) porque col1/col2 coinciden con
    -- variables OUT del RETURNS TABLE y PostgreSQL los marca como ambiguos.
    UPDATE TelefonoUsuario AS tu
    SET    IsActivo = TRUE
    WHERE  tu.IdUsuario        = v_id_usuario
    AND    tu.TelefonoUsuario  = p_telefono;

    IF NOT FOUND THEN
        INSERT INTO TelefonoUsuario (IdUsuario, TelefonoUsuario, IsActivo)
        VALUES (v_id_usuario, p_telefono, TRUE);
    END IF;

    -- Actualizar estado activo/inactivo del Cliente
    UPDATE Cliente SET IsActivo = p_is_activo
    WHERE  Cliente.IdCliente = p_id_cliente;

    -- Retornar cliente actualizado
    RETURN QUERY SELECT * FROM sp_obtener_cliente_por_id(p_id_cliente);
END;
$$;


-- ---------------------------------------------------------------------
-- 5. sp_desactivar_cliente
--    Borrado lógico (soft delete). No elimina registros; preserva el
--    historial transaccional del cliente (RF-05, RNF-05).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_desactivar_cliente(
    p_id_cliente INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE Cliente SET IsActivo = FALSE WHERE IdCliente = p_id_cliente;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cliente con id % no encontrado', p_id_cliente;
    END IF;

    RETURN TRUE;
END;
$$;


-- ---------------------------------------------------------------------
-- 6. sp_obtener_historial_cliente
--    Devuelve los pedidos del cliente con sus líneas de detalle.
--    Ordenado más reciente primero (RF-06).
--    Solo incluye pedidos que ya fueron confirmados (Pagado en adelante:
--    Pagado, Enviado, Entregado). Un pedido Pendiente aún no es una compra
--    real, y uno Cancelado se revirtió — ninguno cuenta como historial.
--    Índice idx_pedido_cliente cubre esta consulta para cumplir < 2 s (§7).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_obtener_historial_cliente(
    p_id_cliente INT
)
RETURNS TABLE (
    IdPedido       INT,
    FechaPedido    DATE,
    EstadoPedido   VARCHAR,
    Subtotal       NUMERIC,
    Impuestos      NUMERIC,
    Total          NUMERIC,
    IdProducto     INT,
    NombreProducto VARCHAR,
    Cantidad       INT,
    PrecioCongelado NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.IdPedido,
        p.FechaPedido,
        e.Estado          AS EstadoPedido,
        p.Subtotal,
        p.Impuestos,
        p.Total,
        lp.IdProducto,
        pr.NombreProducto,
        lp.Cantidad,
        lp.PrecioCongelado
    FROM  Pedido p
    INNER JOIN Estado        e  ON p.EstadoPedido  = e.IdEstado
    LEFT  JOIN LineaDePedido lp ON p.IdPedido       = lp.IdPedido
    LEFT  JOIN Producto      pr ON lp.IdProducto    = pr.IdProducto
    WHERE p.IdCliente = p_id_cliente
      AND e.Estado IN ('Pagado', 'Enviado', 'Entregado')
    ORDER BY p.FechaPedido DESC, p.IdPedido DESC, lp.IdProducto;
END;
$$;
