-- =====================================================
-- FIX: ELIMINAR FOREIGN KEYS A auth.users
-- =====================================================
-- El problema es que las tablas referencian auth.users(id)
-- pero el frontend usa un AuthContext personalizado con IDs
-- que no existen en auth.users

-- =====================================================
-- 1. CARRITO
-- =====================================================
-- Eliminar la foreign key existente
ALTER TABLE carrito 
DROP CONSTRAINT IF EXISTS carrito_usuario_id_fkey;

-- Ahora usuario_id puede ser cualquier UUID sin validación en auth.users

-- =====================================================
-- 2. PEDIDOS
-- =====================================================
ALTER TABLE pedidos 
DROP CONSTRAINT IF EXISTS pedidos_usuario_id_fkey;

-- =====================================================
-- 3. REPARTIDORES
-- =====================================================
ALTER TABLE repartidores 
DROP CONSTRAINT IF EXISTS repartidores_usuario_id_fkey;

-- =====================================================
-- 4. NOTIFICACIONES
-- =====================================================
ALTER TABLE notificaciones 
DROP CONSTRAINT IF EXISTS notificaciones_usuario_id_fkey;

-- =====================================================
-- 5. PERFILES_USUARIO (si existe)
-- =====================================================
ALTER TABLE perfiles_usuario 
DROP CONSTRAINT IF EXISTS perfiles_usuario_id_fkey;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Ver todas las foreign keys restantes
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'users'
  AND tc.table_schema = 'public';

-- El resultado debería estar vacío (sin foreign keys a auth.users)

-- =====================================================
-- NOTA: Ahora puedes usar cualquier UUID como usuario_id
-- sin que exista en auth.users
-- =====================================================
