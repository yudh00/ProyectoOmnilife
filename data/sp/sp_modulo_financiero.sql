-- =====================================================================
-- STORED PROCEDURES — MÓDULO DE ANÁLISIS FINANCIERO (FLUJO DE CAJA)
-- Proyecto Omnilife Store | BD: PostgreSQL "ProyectoIngeneria"
-- =====================================================================
-- DESCRIPCIÓN:
--   Centraliza ingresos por ventas y gastos operativos.
--   Calcula rentabilidad, flujo de caja neto y estadísticas.
--   SOLUCIONA BUG CRÍTICO: Cancelación de pedido revierte MovimientoCaja
-- 
-- EJECUCIÓN:
--   psql -U postgres -d ProyectoIngeneria -f data/sp/sp_modulo_financiero.sql
-- =====================================================================



-- =====================================================================
-- 1.a TRIGGER: registrar INGRESO cuando un pedido pasa a 'Pagado'
--    Inserta en MovimientoCaja al momento del pago para que el ingreso
--    quede persistido aunque el pedido avance a Enviado o Entregado.
-- =====================================================================
CREATE OR REPLACE FUNCTION trg_registrar_ingreso_pago_pedido()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_estado_pagado INT;
    v_numero_pedido VARCHAR;
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.EstadoPedido <> OLD.EstadoPedido THEN
        SELECT IdEstado INTO v_estado_pagado FROM Estado WHERE Estado = 'Pagado';

        IF v_estado_pagado IS NOT NULL AND NEW.EstadoPedido = v_estado_pagado THEN
            v_numero_pedido := 'PED-' || EXTRACT(YEAR FROM COALESCE(NEW.FechaPedido, CURRENT_DATE)) || '-' || LPAD(NEW.IdPedido::TEXT, 6, '0');

            INSERT INTO MovimientoCaja (TipoMovimiento, Monto, Fecha, Concepto)
            VALUES (
                TRUE,
                NEW.Total,
                (CURRENT_TIMESTAMP AT TIME ZONE 'America/Costa_Rica')::DATE,
                'Pedido ' || v_numero_pedido || ' - Pago confirmado'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pedido_pagado_movimiento_caja ON Pedido;

CREATE TRIGGER pedido_pagado_movimiento_caja
AFTER UPDATE OF EstadoPedido ON Pedido
FOR EACH ROW
WHEN (OLD.EstadoPedido IS DISTINCT FROM NEW.EstadoPedido)
EXECUTE FUNCTION trg_registrar_ingreso_pago_pedido();


-- =====================================================================
-- 1.b TRIGGER: registrar EGRESO cuando un pedido se cancela
-- =====================================================================
CREATE OR REPLACE FUNCTION trg_registrar_egreso_cancelacion_pedido()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_estado_cancelado INT;
    v_numero_pedido VARCHAR;
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.EstadoPedido <> OLD.EstadoPedido THEN
        SELECT IdEstado INTO v_estado_cancelado FROM Estado WHERE Estado = 'Cancelado';

        IF v_estado_cancelado IS NOT NULL AND NEW.EstadoPedido = v_estado_cancelado THEN
            v_numero_pedido := 'PED-' || EXTRACT(YEAR FROM COALESCE(NEW.FechaPedido, CURRENT_DATE)) || '-' || LPAD(NEW.IdPedido::TEXT, 6, '0');

            INSERT INTO MovimientoCaja (TipoMovimiento, Monto, Fecha, Concepto)
            VALUES (
                FALSE,
                NEW.Total,
                (CURRENT_TIMESTAMP AT TIME ZONE 'America/Costa_Rica')::DATE,
                'Pedido ' || v_numero_pedido || ' cancelado - Reembolso'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pedido_cancelado_movimiento_caja ON Pedido;

CREATE TRIGGER pedido_cancelado_movimiento_caja
AFTER UPDATE OF EstadoPedido ON Pedido
FOR EACH ROW
WHEN (OLD.EstadoPedido IS DISTINCT FROM NEW.EstadoPedido)
EXECUTE FUNCTION trg_registrar_egreso_cancelacion_pedido();


-- =====================================================================
-- 2. sp_obtener_ingresos_periodo
--    Suma automáticamente todas las ventas CONFIRMADAS (estado='Pagado')
--    en un rango de fechas especificado.
--    
--    Entrada: fecha_inicio (DATE), fecha_fin (DATE)
--    Salida: Ingresos totales del período
-- =====================================================================
CREATE OR REPLACE FUNCTION sp_obtener_ingresos_periodo(
    p_fecha_inicio DATE,
    p_fecha_fin DATE
)
RETURNS TABLE (
    TotalIngresos NUMERIC,
    CantidadPedidosPagados INT,
    FechaInicio DATE,
    FechaFin DATE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(mc.Monto), 0::NUMERIC) AS TotalIngresos,
        COUNT(mc.IdMovimiento)::INT          AS CantidadPedidosPagados,
        p_fecha_inicio,
        p_fecha_fin
    FROM MovimientoCaja mc
    WHERE mc.TipoMovimiento = TRUE
        AND mc.Fecha BETWEEN p_fecha_inicio AND p_fecha_fin
    GROUP BY p_fecha_inicio, p_fecha_fin;
END;
$$;


-- =====================================================================
-- 3. sp_obtener_gastos_periodo
--    Obtiene TODOS los egresos (salidas) de MovimientoCaja en un período.
--    Incluye cancelaciones de pedidos + gastos operativos manuales.
--    
--    Entrada: fecha_inicio (DATE), fecha_fin (DATE)
--    Salida: Egresos totales agrupados por concepto
-- =====================================================================
CREATE OR REPLACE FUNCTION sp_obtener_gastos_periodo(
    p_fecha_inicio DATE,
    p_fecha_fin DATE
)
RETURNS TABLE (
    TotalGastos NUMERIC,
    CantidadMovimientos INT,
    FechaInicio DATE,
    FechaFin DATE,
    DetalleGastos TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_detalle TEXT;
BEGIN
    -- Construir detalle de gastos agrupados por concepto
    SELECT STRING_AGG(
        concepto_desc || ': ' || monto_total::TEXT,
        ' | '
        ORDER BY monto_total DESC
    ) INTO v_detalle
    FROM (
        SELECT 
            COALESCE(mc.Concepto, 'Gasto sin descripción') AS concepto_desc,
            SUM(mc.Monto)::NUMERIC(10,2) AS monto_total
        FROM MovimientoCaja mc
        WHERE mc.TipoMovimiento = FALSE  -- FALSE = Salida/Egreso
            AND mc.Fecha BETWEEN p_fecha_inicio AND p_fecha_fin
        GROUP BY mc.Concepto
    ) detalle;

    RETURN QUERY
    SELECT 
        COALESCE(SUM(mc.Monto), 0::NUMERIC) AS TotalGastos,
        COUNT(mc.IdMovimiento)::INT AS CantidadMovimientos,
        p_fecha_inicio,
        p_fecha_fin,
        COALESCE(v_detalle, 'Sin gastos registrados') AS DetalleGastos
    FROM MovimientoCaja mc
    WHERE mc.TipoMovimiento = FALSE
        AND mc.Fecha BETWEEN p_fecha_inicio AND p_fecha_fin;
END;
$$;


-- =====================================================================
-- 4. sp_calcular_rentabilidad_producto
--    Calcula la rentabilidad UNITARIA de un producto.
--    
--    Fórmula: Rentabilidad = Precio Venta - Costo Adquisición
--    
--    Entrada: IdProducto (INT)
--    Salida: Rentabilidad, porcentaje de margen
-- =====================================================================
CREATE OR REPLACE FUNCTION sp_calcular_rentabilidad_producto(
    p_id_producto INT
)
RETURNS TABLE (
    IdProducto INT,
    NombreProducto VARCHAR,
    PrecioVenta NUMERIC,
    CostoAdquisicion NUMERIC,
    RentabilidadUnitaria NUMERIC,
    MargenPorcentual NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.IdProducto,
        p.NombreProducto,
        p.PrecioVentaProducto,
        p.CostoCompraProducto,
        (p.PrecioVentaProducto - p.CostoCompraProducto) AS RentabilidadUnitaria,
        CASE 
            WHEN p.CostoCompraProducto = 0 THEN 0::NUMERIC
            ELSE ROUND(
                ((p.PrecioVentaProducto - p.CostoCompraProducto) / p.CostoCompraProducto * 100),
                2
            )
        END AS MargenPorcentual
    FROM Producto p
    WHERE p.IdProducto = p_id_producto;
END;
$$;


-- =====================================================================
-- 5. sp_obtener_flujo_caja_neto
--    Calcula el flujo de caja neto para un período.
--    Entrada: fecha_inicio, fecha_fin
--    Salida: Total ingresos, total egresos, flujo neto y conteos simples
-- =====================================================================
CREATE OR REPLACE FUNCTION sp_obtener_flujo_caja_neto(
    p_fecha_inicio DATE,
    p_fecha_fin DATE
)
RETURNS TABLE (
    TotalIngresos NUMERIC,
    TotalEgresos NUMERIC,
    FlujoCajaNeto NUMERIC,
    CantidadIngresos INT,
    CantidadEgresos INT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(CASE WHEN mc.TipoMovimiento = TRUE  THEN mc.Monto ELSE 0 END), 0::NUMERIC) AS TotalIngresos,
        COALESCE(SUM(CASE WHEN mc.TipoMovimiento = FALSE THEN mc.Monto ELSE 0 END), 0::NUMERIC) AS TotalEgresos,
        COALESCE(SUM(CASE WHEN mc.TipoMovimiento = TRUE  THEN mc.Monto ELSE -mc.Monto END), 0::NUMERIC) AS FlujoCajaNeto,
        COUNT(CASE WHEN mc.TipoMovimiento = TRUE  THEN 1 END)::INT AS CantidadIngresos,
        COUNT(CASE WHEN mc.TipoMovimiento = FALSE THEN 1 END)::INT AS CantidadEgresos
    FROM MovimientoCaja mc
    WHERE mc.Fecha BETWEEN p_fecha_inicio AND p_fecha_fin;
END;
$$;


-- =====================================================================
-- 6. sp_obtener_estadisticas_periodo
--    Genera reportes estadísticos del flujo de caja.
--    Incluye: ticket promedio, rentabilidad, gastos promedio, etc.
--    
--    Entrada: fecha_inicio (DATE), fecha_fin (DATE)
--    Salida: Múltiples métricas financieras agregadas
-- =====================================================================
CREATE OR REPLACE FUNCTION sp_obtener_estadisticas_periodo(
    p_fecha_inicio DATE,
    p_fecha_fin DATE
)
RETURNS TABLE (
    TotalIngresos NUMERIC,
    TotalEgresos NUMERIC,
    FlujoCajaNeto NUMERIC,
    TicketPromedio NUMERIC,
    PedidosCompletados INT,
    PedidosCancelados INT,
    GastoPromedioPorPedido NUMERIC,
    RentabilidadPromedioProductos NUMERIC,
    MargenPromedioPorcentual NUMERIC,
    DiasMedidos INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_ingresos NUMERIC;
    v_total_egresos NUMERIC;
    v_flujo_neto NUMERIC;
    v_ticket_promedio NUMERIC;
    v_pedidos_pagados INT;
    v_pedidos_cancelados INT;
    v_gasto_promedio NUMERIC;
    v_rentabilidad_promedio NUMERIC;
    v_margen_promedio NUMERIC;
    v_dias_medidos INT;
BEGIN
    -- Total de ingresos (leído de MovimientoCaja para que no desaparezca
    -- cuando el pedido avanza a Enviado o Entregado)
    SELECT COALESCE(SUM(mc.Monto), 0::NUMERIC), COUNT(mc.IdMovimiento)
    INTO v_total_ingresos, v_pedidos_pagados
    FROM MovimientoCaja mc
    WHERE mc.TipoMovimiento = TRUE
        AND mc.Fecha BETWEEN p_fecha_inicio AND p_fecha_fin;

    -- Total de egresos
    SELECT COALESCE(SUM(mc.Monto), 0::NUMERIC)
    INTO v_total_egresos
    FROM MovimientoCaja mc
    WHERE mc.TipoMovimiento = FALSE
        AND mc.Fecha BETWEEN p_fecha_inicio AND p_fecha_fin;

    -- Flujo neto
    v_flujo_neto := v_total_ingresos - v_total_egresos;

    -- Ticket promedio
    v_ticket_promedio := CASE 
        WHEN v_pedidos_pagados > 0 THEN ROUND(v_total_ingresos / v_pedidos_pagados, 2)
        ELSE 0::NUMERIC
    END;

    -- Pedidos cancelados
    SELECT COUNT(p.IdPedido)
    INTO v_pedidos_cancelados
    FROM Pedido p
    INNER JOIN Estado e ON p.EstadoPedido = e.IdEstado
    WHERE e.Estado = 'Cancelado'
        AND p.FechaPedido BETWEEN p_fecha_inicio AND p_fecha_fin;

    -- Gasto promedio por pedido pagado
    v_gasto_promedio := CASE 
        WHEN v_pedidos_pagados > 0 THEN ROUND(v_total_egresos / v_pedidos_pagados, 2)
        ELSE 0::NUMERIC
    END;

    -- Rentabilidad promedio de productos vendidos
    SELECT ROUND(AVG(p.PrecioVentaProducto - p.CostoCompraProducto), 2),
           ROUND(AVG(CASE 
               WHEN p.CostoCompraProducto = 0 THEN 0::NUMERIC
               ELSE ((p.PrecioVentaProducto - p.CostoCompraProducto) / p.CostoCompraProducto * 100)
           END), 2)
    INTO v_rentabilidad_promedio, v_margen_promedio
    FROM Producto p
    WHERE EXISTS (
        SELECT 1 FROM LineaDePedido lp
        INNER JOIN Pedido ped ON lp.IdPedido = ped.IdPedido
        INNER JOIN Estado e ON ped.EstadoPedido = e.IdEstado
        WHERE lp.IdProducto = p.IdProducto
            AND e.Estado = 'Pagado'
            AND ped.FechaPedido BETWEEN p_fecha_inicio AND p_fecha_fin
    );

    -- Días medidos
    v_dias_medidos := (p_fecha_fin - p_fecha_inicio) + 1;

    RETURN QUERY 
    SELECT 
        v_total_ingresos,
        v_total_egresos,
        v_flujo_neto,
        v_ticket_promedio,
        v_pedidos_pagados,
        v_pedidos_cancelados,
        v_gasto_promedio,
        COALESCE(v_rentabilidad_promedio, 0::NUMERIC),
        COALESCE(v_margen_promedio, 0::NUMERIC),
        v_dias_medidos;
END;
$$;


-- =====================================================================
-- 7. sp_rentabilidad_por_periodo
--    Calcula la rentabilidad neta de un período como INGRESSOS - EGRESOS.
--    Entrada: fecha_inicio, fecha_fin
--    Salida: total ingresos, total egresos y rentabilidad neta
-- =====================================================================
CREATE OR REPLACE FUNCTION sp_rentabilidad_por_periodo(
    p_fecha_inicio DATE,
    p_fecha_fin DATE
)
RETURNS TABLE (
    FechaInicio DATE,
    FechaFin DATE,
    TotalIngresos NUMERIC,
    TotalEgresos NUMERIC,
    RentabilidadNeta NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p_fecha_inicio AS FechaInicio,
        p_fecha_fin AS FechaFin,
        COALESCE(
            (SELECT SUM(mc_ing.Monto)
             FROM MovimientoCaja mc_ing
             WHERE mc_ing.TipoMovimiento = TRUE
               AND mc_ing.Fecha BETWEEN p_fecha_inicio AND p_fecha_fin),
            0::NUMERIC
        ) AS TotalIngresos,
        COALESCE(
            (SELECT SUM(mc_eg.Monto)
             FROM MovimientoCaja mc_eg
             WHERE mc_eg.TipoMovimiento = FALSE
               AND mc_eg.Fecha BETWEEN p_fecha_inicio AND p_fecha_fin),
            0::NUMERIC
        ) AS TotalEgresos,
        COALESCE(
            (SELECT SUM(mc_ing.Monto)
             FROM MovimientoCaja mc_ing
             WHERE mc_ing.TipoMovimiento = TRUE
               AND mc_ing.Fecha BETWEEN p_fecha_inicio AND p_fecha_fin),
            0::NUMERIC
        ) - COALESCE(
            (SELECT SUM(mc_eg.Monto)
             FROM MovimientoCaja mc_eg
             WHERE mc_eg.TipoMovimiento = FALSE
               AND mc_eg.Fecha BETWEEN p_fecha_inicio AND p_fecha_fin),
            0::NUMERIC
        ) AS RentabilidadNeta;
END;
$$;


-- =====================================================================
-- ÍNDICES RECOMENDADOS PARA OPTIMIZAR CONSULTAS
-- =====================================================================
-- Estos índices mejoran el rendimiento de los SPs sin alterar la BD existente

CREATE INDEX IF NOT EXISTS idx_movimientocaja_fecha_tipo
    ON MovimientoCaja(Fecha, TipoMovimiento);

CREATE INDEX IF NOT EXISTS idx_pedido_fecha_estado
    ON Pedido(FechaPedido, EstadoPedido);

CREATE INDEX IF NOT EXISTS idx_lineapedido_idproducto
    ON LineaDePedido(IdProducto);


