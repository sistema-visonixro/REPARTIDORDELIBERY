-- =====================================================
-- SCRIPT MAESTRO - SISTEMA DE DELIVERY COMPLETO
-- =====================================================
-- Este script ejecuta todos los SQL necesarios en el orden correcto
-- Ejecutar en Supabase SQL Editor

-- =====================================================
-- 1. ACTUALIZAR TABLA PLATILLOS CON CATEGORÍAS
-- =====================================================
\i 01_actualizar_platillos_categoria.sql

-- =====================================================
-- 2. CREAR TABLA DE CARRITO
-- =====================================================
\i 02_crear_tabla_carrito.sql

-- =====================================================
-- 3. CREAR TABLA DE PEDIDOS Y DETALLE
-- =====================================================
\i 03_crear_tabla_pedidos.sql

-- =====================================================
-- 4. CREAR TABLA DE REPARTIDORES Y UBICACIONES
-- =====================================================
\i 04_crear_tabla_repartidores.sql

-- =====================================================
-- 5. CREAR VISTAS DEL SISTEMA
-- =====================================================
\i 05_crear_vistas_sistema.sql

-- =====================================================
-- 6. CREAR FUNCIONES ADICIONALES Y PERFILES
-- =====================================================
\i 06_funciones_adicionales_sistema.sql

-- =====================================================
-- DATOS DE EJEMPLO PARA CATEGORÍA_TIPO
-- =====================================================

-- Insertar datos de ejemplo en platillos con categoria_tipo
-- Ajusta los IDs según tu base de datos

-- Ejemplo de actualización por nombre de categoría
UPDATE platillos p
SET categoria_tipo = CASE 
  WHEN c.nombre ILIKE '%taco%' OR c.nombre ILIKE '%torta%' OR c.nombre ILIKE '%hamburguesa%' OR c.nombre ILIKE '%pizza%' THEN 'comida'
  WHEN c.nombre ILIKE '%jugo%' OR c.nombre ILIKE '%refresco%' OR c.nombre ILIKE '%agua%' OR c.nombre ILIKE '%café%' THEN 'bebida'
  WHEN c.nombre ILIKE '%postre%' OR c.nombre ILIKE '%pastel%' OR c.nombre ILIKE '%helado%' OR c.nombre ILIKE '%flan%' THEN 'postre'
  WHEN c.nombre ILIKE '%mandadito%' THEN 'mandadito'
  ELSE 'comida'
END
FROM categorias c
WHERE p.categoria_id = c.id
  AND p.categoria_tipo IS NULL;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar tablas creadas
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as num_columnas
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'carrito',
    'pedidos',
    'detalle_pedidos',
    'repartidores',
    'ubicaciones_repartidor',
    'perfiles_usuario',
    'notificaciones'
  )
ORDER BY table_name;

-- Verificar vistas creadas
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name LIKE 'vista_%'
ORDER BY table_name;

-- Verificar funciones creadas
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND routine_name IN (
    'crear_pedido_desde_carrito',
    'asignar_repartidor_pedido',
    'actualizar_ubicacion_repartidor',
    'obtener_repartidores_cercanos',
    'crear_notificacion'
  )
ORDER BY routine_name;

COMMIT;

-- =====================================================
-- ¡INSTALACIÓN COMPLETA!
-- =====================================================
