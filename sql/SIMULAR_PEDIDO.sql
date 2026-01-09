-- =====================================================
-- SIMULAR FLUJO COMPLETO DE PEDIDO
-- =====================================================

-- 1. Ver tu pedido actual
SELECT 
  id,
  estado,
  direccion_entrega,
  total,
  creado_en
FROM pedidos 
WHERE estado != 'entregado' 
ORDER BY creado_en DESC 
LIMIT 1;

-- Copia el ID del pedido de arriba y úsalo en las siguientes queries
-- Reemplaza 'TU_PEDIDO_ID_AQUI' con el UUID real

-- =====================================================
-- PASO 1: Restaurante confirma el pedido
-- =====================================================
UPDATE pedidos 
SET 
  estado = 'confirmado',
  confirmado_en = NOW()
WHERE id = 'TU_PEDIDO_ID_AQUI';

-- =====================================================
-- PASO 2: Restaurante empieza a preparar
-- =====================================================
UPDATE pedidos 
SET 
  estado = 'preparando',
  preparando_en = NOW()
WHERE id = 'TU_PEDIDO_ID_AQUI';

-- =====================================================
-- PASO 3: Comida lista para recoger
-- =====================================================
UPDATE pedidos 
SET 
  estado = 'listo',
  listo_en = NOW()
WHERE id = 'TU_PEDIDO_ID_AQUI';

-- =====================================================
-- PASO 4: Crear perfil de repartidor (si no existe)
-- =====================================================
-- Primero crea un repartidor de prueba
INSERT INTO repartidores (
  usuario_id,
  nombre_completo,
  telefono,
  tipo_vehiculo,
  disponible,
  latitud_actual,
  longitud_actual
) VALUES (
  gen_random_uuid(), -- Genera un UUID aleatorio para el repartidor
  'Juan Pérez - Repartidor Test',
  '5551234567',
  'moto',
  true,
  19.4326, -- Latitud de ejemplo (Ciudad de México)
  -99.1332 -- Longitud de ejemplo
) RETURNING id, usuario_id, nombre_completo;

-- Copia el ID del repartidor que se muestra arriba

-- =====================================================
-- PASO 5: Asignar repartidor al pedido
-- =====================================================
-- Opción A: Usando la función RPC
SELECT asignar_repartidor_pedido(
  'TU_PEDIDO_ID_AQUI'::uuid,
  'TU_REPARTIDOR_ID_AQUI'::uuid
);

-- Opción B: Manual (si la función falla)
UPDATE pedidos 
SET 
  estado = 'en_camino',
  repartidor_id = 'TU_REPARTIDOR_ID_AQUI',
  asignado_en = NOW(),
  en_camino_en = NOW()
WHERE id = 'TU_PEDIDO_ID_AQUI';

-- =====================================================
-- PASO 6: Simular tracking GPS del repartidor
-- =====================================================
-- Insertar algunas ubicaciones de prueba
INSERT INTO ubicaciones_repartidor (
  repartidor_id,
  pedido_id,
  latitud,
  longitud,
  velocidad
) VALUES 
  ('TU_REPARTIDOR_ID_AQUI', 'TU_PEDIDO_ID_AQUI', 19.4326, -99.1332, 25.5),
  ('TU_REPARTIDOR_ID_AQUI', 'TU_PEDIDO_ID_AQUI', 19.4330, -99.1328, 28.3),
  ('TU_REPARTIDOR_ID_AQUI', 'TU_PEDIDO_ID_AQUI', 19.4335, -99.1324, 30.1);

-- =====================================================
-- PASO 7: Marcar como entregado
-- =====================================================
UPDATE pedidos 
SET 
  estado = 'entregado',
  entregado_en = NOW()
WHERE id = 'TU_PEDIDO_ID_AQUI';

-- =====================================================
-- VERIFICACIÓN: Ver el pedido completo con todos los detalles
-- =====================================================
SELECT * FROM vista_pedidos_cliente 
WHERE pedido_id = 'TU_PEDIDO_ID_AQUI';

-- Ver el timeline completo
SELECT 
  id,
  estado,
  creado_en,
  confirmado_en,
  preparando_en,
  listo_en,
  asignado_en,
  en_camino_en,
  entregado_en
FROM pedidos 
WHERE id = 'TU_PEDIDO_ID_AQUI';

-- Ver las notificaciones generadas
SELECT * FROM notificaciones 
WHERE pedido_id = 'TU_PEDIDO_ID_AQUI'
ORDER BY creado_en DESC;
