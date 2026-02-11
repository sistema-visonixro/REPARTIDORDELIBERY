-- =====================================================
-- FIX: USAR IDs DE REPARTIDORES (SIN AUTH)
-- =====================================================
-- Este script elimina FKs a auth.users y agrega FK a repartidores
-- donde aplica para repartidor_id.

-- Pedidos: quitar FK previa (si existe) y crear FK a repartidores
ALTER TABLE pedidos
DROP CONSTRAINT IF EXISTS pedidos_repartidor_id_fkey;

ALTER TABLE pedidos
ADD CONSTRAINT pedidos_repartidor_id_fkey
FOREIGN KEY (repartidor_id)
REFERENCES repartidores(id)
ON DELETE SET NULL;

-- Notificaciones: quitar FK a auth.users si existe
ALTER TABLE notificaciones
DROP CONSTRAINT IF EXISTS notificaciones_usuario_id_fkey;

-- Repartidores: quitar FK a auth.users si existe
ALTER TABLE repartidores
DROP CONSTRAINT IF EXISTS repartidores_usuario_id_fkey;

-- Pedidos realizados por repartidor (si la tabla existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'pedidos_realizados_de_repartidor'
  ) THEN
    EXECUTE 'ALTER TABLE pedidos_realizados_de_repartidor DROP CONSTRAINT IF EXISTS pedidos_realizados_de_repartidor_repartidor_id_fkey';
    EXECUTE 'ALTER TABLE pedidos_realizados_de_repartidor ADD CONSTRAINT pedidos_realizados_de_repartidor_repartidor_id_fkey FOREIGN KEY (repartidor_id) REFERENCES repartidores(id) ON DELETE CASCADE';
  END IF;
END $$;
