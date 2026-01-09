-- =====================================================
-- FIX: POLÍTICAS RLS PARA CARRITO
-- =====================================================
-- Este archivo corrige el problema de RLS con el carrito
-- El problema es que el frontend usa un AuthContext personalizado
-- pero Supabase RLS espera auth.uid() de Supabase Auth

-- OPCIÓN 1: Deshabilitar RLS temporalmente (solo para desarrollo)
-- ⚠️ ADVERTENCIA: Esto permite a cualquier usuario acceder a cualquier carrito
-- Solo usar en desarrollo local, NUNCA en producción

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Usuarios pueden ver su carrito" ON carrito;
DROP POLICY IF EXISTS "Usuarios pueden agregar a su carrito" ON carrito;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su carrito" ON carrito;
DROP POLICY IF EXISTS "Usuarios pueden eliminar de su carrito" ON carrito;

-- Deshabilitar RLS temporalmente
ALTER TABLE carrito DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- NOTA: Para producción, debes:
-- 1. Usar Supabase Auth en lugar del AuthContext personalizado
-- 2. O crear una función que valide el usuario de otra manera
-- =====================================================

-- OPCIÓN 2 (comentada): Crear políticas permisivas para desarrollo
-- ALTER TABLE carrito ENABLE ROW LEVEL SECURITY;
-- 
-- -- Permitir a usuarios autenticados ver todo (desarrollo)
-- CREATE POLICY "Desarrollo: ver carrito"
--   ON carrito FOR SELECT
--   TO authenticated
--   USING (true);
-- 
-- -- Permitir a usuarios autenticados insertar (desarrollo)
-- CREATE POLICY "Desarrollo: insertar carrito"
--   ON carrito FOR INSERT
--   TO authenticated
--   WITH CHECK (true);
-- 
-- -- Permitir a usuarios autenticados actualizar (desarrollo)
-- CREATE POLICY "Desarrollo: actualizar carrito"
--   ON carrito FOR UPDATE
--   TO authenticated
--   USING (true)
--   WITH CHECK (true);
-- 
-- -- Permitir a usuarios autenticados eliminar (desarrollo)
-- CREATE POLICY "Desarrollo: eliminar carrito"
--   ON carrito FOR DELETE
--   TO authenticated
--   USING (true);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'carrito';

-- Mostrar políticas actuales (debería estar vacío después de DROP)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'carrito';
