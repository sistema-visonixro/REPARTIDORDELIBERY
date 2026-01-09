-- =====================================================
-- ACTUALIZAR TABLA PLATILLOS CON COLUMNA CATEGORIA_TIPO
-- =====================================================
-- Esta columna identifica si el platillo es: comida, bebida, postre, mandadito

-- 1. Agregar columna categoria_tipo
ALTER TABLE platillos 
ADD COLUMN IF NOT EXISTS categoria_tipo VARCHAR(50);

-- 2. Crear índice para mejorar consultas por tipo
CREATE INDEX IF NOT EXISTS idx_platillos_categoria_tipo ON platillos(categoria_tipo);

-- 3. Actualizar datos existentes según categoria_id
-- Asumiendo que ya tienes categorías creadas con IDs específicos
-- Ajusta los IDs según tu base de datos

-- Opción A: Si tienes las categorías con nombres conocidos
UPDATE platillos p
SET categoria_tipo = CASE 
  WHEN c.nombre ILIKE '%comida%' OR c.nombre ILIKE '%plato%' OR c.nombre ILIKE '%alimento%' THEN 'comida'
  WHEN c.nombre ILIKE '%bebida%' OR c.nombre ILIKE '%jugo%' OR c.nombre ILIKE '%refresco%' THEN 'bebida'
  WHEN c.nombre ILIKE '%postre%' OR c.nombre ILIKE '%dulce%' OR c.nombre ILIKE '%helado%' THEN 'postre'
  WHEN c.nombre ILIKE '%mandadito%' OR c.nombre ILIKE '%mandado%' THEN 'mandadito'
  ELSE 'comida' -- default
END
FROM categorias c
WHERE p.categoria_id = c.id;

-- Opción B: Si conoces los IDs específicos de tus categorías
-- Descomenta y ajusta según tus IDs reales:
/*
UPDATE platillos SET categoria_tipo = 'comida' WHERE categoria_id = 'TU_ID_COMIDAS';
UPDATE platillos SET categoria_tipo = 'bebida' WHERE categoria_id = 'TU_ID_BEBIDAS';
UPDATE platillos SET categoria_tipo = 'postre' WHERE categoria_id = 'TU_ID_POSTRES';
UPDATE platillos SET categoria_tipo = 'mandadito' WHERE categoria_id = 'TU_ID_MANDADITOS';
*/

-- 4. Establecer valor por defecto para futuros registros
ALTER TABLE platillos 
ALTER COLUMN categoria_tipo SET DEFAULT 'comida';

-- 5. Agregar constraint para validar valores permitidos
ALTER TABLE platillos
ADD CONSTRAINT check_categoria_tipo 
CHECK (categoria_tipo IN ('comida', 'bebida', 'postre', 'mandadito'));

-- 6. Actualizar platillos sin tipo asignado
UPDATE platillos 
SET categoria_tipo = 'comida' 
WHERE categoria_tipo IS NULL;

-- Verificar resultados
SELECT categoria_tipo, COUNT(*) as total
FROM platillos
GROUP BY categoria_tipo
ORDER BY categoria_tipo;
