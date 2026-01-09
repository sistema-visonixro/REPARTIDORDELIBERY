-- =====================================================
-- CONFIGURACIÓN DE PERMISOS RLS (Row Level Security)
-- Ejecuta esto DESPUÉS de crear las tablas
-- =====================================================

-- Habilitar RLS en las tablas
ALTER TABLE restaurantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE platillos ENABLE ROW LEVEL SECURITY;
ALTER TABLE bebidas ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS DE LECTURA PÚBLICA
-- Permitir que cualquiera pueda leer los datos
-- =====================================================

-- Restaurantes: Lectura pública
CREATE POLICY "Permitir lectura pública de restaurantes"
ON restaurantes FOR SELECT
TO public
USING (true);

-- Categorías: Lectura pública
CREATE POLICY "Permitir lectura pública de categorías"
ON categorias FOR SELECT
TO public
USING (true);

-- Platillos: Lectura pública
CREATE POLICY "Permitir lectura pública de platillos"
ON platillos FOR SELECT
TO public
USING (true);

-- Bebidas: Lectura pública
CREATE POLICY "Permitir lectura pública de bebidas"
ON bebidas FOR SELECT
TO public
USING (true);

-- =====================================================
-- POLÍTICAS DE ESCRITURA (Solo autenticados o admin)
-- Opcional: Puedes ajustar según tus necesidades
-- =====================================================

-- Si quieres que solo usuarios autenticados puedan modificar:
-- CREATE POLICY "Solo autenticados pueden insertar restaurantes"
-- ON restaurantes FOR INSERT
-- TO authenticated
-- WITH CHECK (true);

-- CREATE POLICY "Solo autenticados pueden actualizar restaurantes"
-- ON restaurantes FOR UPDATE
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);

-- CREATE POLICY "Solo autenticados pueden eliminar restaurantes"
-- ON restaurantes FOR DELETE
-- TO authenticated
-- USING (true);
