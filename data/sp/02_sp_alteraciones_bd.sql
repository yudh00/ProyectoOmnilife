-- =====================================================================
-- ALTERACIONES DE BASE DE DATOS — MÓDULO GESTIÓN DE CLIENTES
-- Proyecto Omnilife Store | BD: PostgreSQL "ProyectoIngeneria"
-- =====================================================================
-- EJECUCIÓN:
--   psql -U postgres -d ProyectoIngeneria -f data/sp/02_sp_alteraciones_bd.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tabla Rol
--    Extiende el patrón de tablas de referencia del proyecto (como Estado).
--    IdRol 1 = Administrador, IdRol 2 = Cliente
--    SOLID/OCP: agregar nuevos roles no modifica tablas existentes.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Rol (
    IdRol   SERIAL PRIMARY KEY,
    NombreRol      VARCHAR(50)  NOT NULL,
    DescripcionRol VARCHAR(255)
);

-- Idempotentes: no falla si ya existen los registros
INSERT INTO Rol (NombreRol, DescripcionRol)
SELECT 'Administrador', 'Acceso total al sistema'
WHERE NOT EXISTS (SELECT 1 FROM Rol WHERE NombreRol = 'Administrador');

INSERT INTO Rol (NombreRol, DescripcionRol)
SELECT 'Cliente', 'Acceso a su perfil y catálogo de productos'
WHERE NOT EXISTS (SELECT 1 FROM Rol WHERE NombreRol = 'Cliente');


-- ---------------------------------------------------------------------
-- 2. Columna IdRol en Usuario
--    Permite que el módulo de Seguridad/RBAC consulte el rol directamente
--    desde el token JWT sin joins adicionales.
-- ---------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'usuario' AND column_name = 'idrol'
    ) THEN
        ALTER TABLE Usuario
            ADD COLUMN IdRol INT NOT NULL DEFAULT 2,
            ADD CONSTRAINT fk_usuario_rol
                FOREIGN KEY (IdRol) REFERENCES Rol(IdRol);
    END IF;
END;
$$;


-- ---------------------------------------------------------------------
-- 3. Columna Contrasena en Usuario
--    AVISO DE SEGURIDAD: Almacenará el hash Bcrypt generado por el
--    Módulo de Seguridad. NUNCA texto plano ni SHA-256.
--    Referencia: RNF-03, sección 6.2 ERS — usar Bcrypt o Argon2id.
-- ---------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'usuario' AND column_name = 'contrasena'
    ) THEN
        ALTER TABLE Usuario ADD COLUMN Contrasena VARCHAR(255);
        COMMENT ON COLUMN Usuario.Contrasena IS
            'Hash Bcrypt (costo >= 12) — gestionado por el Módulo de Seguridad. NUNCA texto plano.';
    END IF;
END;
$$;


-- ---------------------------------------------------------------------
-- 4. Columna IdUsuario FK en Cliente (Pregunta 1 — opción B)
--    Establece la relación Cliente → Usuario para completar el modelo TPT.
--    UNIQUE garantiza que cada Usuario es exactamente un Cliente.
-- ---------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'cliente' AND column_name = 'idusuario'
    ) THEN
        ALTER TABLE Cliente
            ADD COLUMN IdUsuario INT UNIQUE,
            ADD CONSTRAINT fk_cliente_usuario
                FOREIGN KEY (IdUsuario) REFERENCES Usuario(IdUsuario)
                ON DELETE CASCADE;
    END IF;
END;
$$;


-- ---------------------------------------------------------------------
-- 5. Índices de rendimiento
--    RF Rendimiento §7: consultas de historial deben responder < 2 s.
-- ---------------------------------------------------------------------

-- Búsqueda por nombre completo (sp_listar_clientes type-ahead)
CREATE INDEX IF NOT EXISTS idx_usuario_nombre
    ON Usuario(NombreUsuario, ApellidosUsuario);

-- Join en historial del cliente (sp_obtener_historial_cliente)
CREATE INDEX IF NOT EXISTS idx_pedido_cliente
    ON Pedido(IdCliente);

-- Join Cliente ↔ Usuario
CREATE INDEX IF NOT EXISTS idx_cliente_usuario
    ON Cliente(IdUsuario);

-- Búsqueda de teléfonos activos (filtro parcial, sp_listar_clientes)
CREATE INDEX IF NOT EXISTS idx_telefono_activo
    ON TelefonoUsuario(IdUsuario, TelefonoUsuario)
    WHERE IsActivo = TRUE;

-- Nota: CorreoElectronico en Usuario ya tiene índice implícito por UNIQUE.
