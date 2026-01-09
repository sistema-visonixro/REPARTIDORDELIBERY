-- =====================================================
-- VISTAS ADICIONALES PARA EL SISTEMA
-- =====================================================

-- =====================================================
-- VISTA: Pedidos del Cliente con Estado Detallado
-- =====================================================
CREATE OR REPLACE VIEW vista_pedidos_cliente AS
SELECT 
  p.id as pedido_id,
  p.usuario_id,
  p.numero_pedido,
  p.total,
  p.estado,
  p.direccion_entrega,
  p.notas_cliente,
  p.creado_en,
  p.actualizado_en,
  
  -- Información del restaurante
  r.id as restaurante_id,
  r.nombre as restaurante_nombre,
  r.emoji as restaurante_emoji,
  r.imagen_url as restaurante_imagen,
  
  -- Información del repartidor (si está asignado)
  rep.id as repartidor_info_id,
  rep.nombre_completo as repartidor_nombre,
  rep.telefono as repartidor_telefono,
  rep.foto_url as repartidor_foto,
  rep.tipo_vehiculo as repartidor_vehiculo,
  rep.calificacion_promedio as repartidor_calificacion,
  
  -- Ubicación actual del repartidor
  rep.latitud_actual as repartidor_latitud,
  rep.longitud_actual as repartidor_longitud,
  rep.ultima_actualizacion_ubicacion as repartidor_ultima_actualizacion,
  
  -- Estados de tiempo
  p.confirmado_en,
  p.asignado_en,
  p.entregado_en,
  
  -- Conteo de items
  (SELECT COUNT(*) FROM detalle_pedidos dp WHERE dp.pedido_id = p.id) as total_items,
  
  -- Indica si el pedido tiene repartidor asignado
  CASE 
    WHEN p.repartidor_id IS NOT NULL THEN true
    ELSE false
  END as tiene_repartidor,
  
  -- Indica si el pedido está en seguimiento activo
  CASE 
    WHEN p.estado = 'en_camino' THEN true
    ELSE false
  END as tracking_activo

FROM pedidos p
LEFT JOIN restaurantes r ON p.restaurante_id = r.id
LEFT JOIN repartidores rep ON p.repartidor_id = rep.usuario_id
WHERE p.estado != 'entregado' -- Solo pedidos no entregados
ORDER BY p.creado_en DESC;

-- =====================================================
-- VISTA: Detalle Completo del Pedido
-- =====================================================
CREATE OR REPLACE VIEW vista_detalle_pedido_completo AS
SELECT 
  dp.id as detalle_id,
  dp.pedido_id,
  dp.cantidad,
  dp.precio_unitario,
  dp.subtotal,
  dp.notas as notas_platillo,
  
  -- Información del platillo
  pl.id as platillo_id,
  pl.nombre as platillo_nombre,
  pl.descripcion as platillo_descripcion,
  pl.imagen_url as platillo_imagen,
  pl.categoria_tipo as platillo_categoria,
  
  -- Información del pedido
  p.numero_pedido,
  p.estado as pedido_estado,
  p.total as pedido_total,
  p.creado_en as pedido_creado_en

FROM detalle_pedidos dp
INNER JOIN platillos pl ON dp.platillo_id = pl.id
INNER JOIN pedidos p ON dp.pedido_id = p.id;

-- =====================================================
-- VISTA: Pedidos Disponibles para Repartidores
-- =====================================================
CREATE OR REPLACE VIEW vista_pedidos_disponibles_repartidores AS
SELECT 
  p.id as pedido_id,
  p.numero_pedido,
  p.total,
  p.estado,
  p.direccion_entrega,
  p.latitud,
  p.longitud,
  p.creado_en,
  
  -- Información del restaurante
  r.nombre as restaurante_nombre,
  r.direccion as restaurante_direccion,
  r.emoji as restaurante_emoji,
  
  -- Información del cliente (limitada por privacidad)
  SUBSTRING(u.email, 1, 1) || '***' || SUBSTRING(u.email FROM POSITION('@' IN u.email)) as cliente_email_parcial,
  
  -- Conteo de items
  (SELECT COUNT(*) FROM detalle_pedidos dp WHERE dp.pedido_id = p.id) as total_items,
  
  -- Tiempo transcurrido
  EXTRACT(EPOCH FROM (NOW() - p.creado_en))/60 as minutos_desde_creacion

FROM pedidos p
INNER JOIN restaurantes r ON p.restaurante_id = r.id
LEFT JOIN auth.users u ON p.usuario_id = u.id
WHERE p.estado IN ('listo', 'confirmado')
  AND p.repartidor_id IS NULL
ORDER BY p.creado_en ASC;

-- =====================================================
-- VISTA: Pedidos Activos del Repartidor
-- =====================================================
CREATE OR REPLACE VIEW vista_pedidos_repartidor AS
SELECT 
  p.id as pedido_id,
  p.repartidor_id,
  p.numero_pedido,
  p.total,
  p.estado,
  p.direccion_entrega,
  p.latitud,
  p.longitud,
  p.notas_cliente,
  p.creado_en,
  p.asignado_en,
  
  -- Información del restaurante
  r.nombre as restaurante_nombre,
  r.direccion as restaurante_direccion,
  r.emoji as restaurante_emoji,
  r.telefono as restaurante_telefono,
  
  -- Información del cliente
  SUBSTRING(u.email, 1, 1) || '***' || SUBSTRING(u.email FROM POSITION('@' IN u.email)) as cliente_email,
  
  -- Items del pedido
  (SELECT COUNT(*) FROM detalle_pedidos dp WHERE dp.pedido_id = p.id) as total_items,
  
  -- Tiempo en estado actual
  EXTRACT(EPOCH FROM (NOW() - p.asignado_en))/60 as minutos_desde_asignacion

FROM pedidos p
INNER JOIN restaurantes r ON p.restaurante_id = r.id
LEFT JOIN auth.users u ON p.usuario_id = u.id
WHERE p.estado IN ('en_camino', 'listo')
  AND p.repartidor_id IS NOT NULL
ORDER BY p.asignado_en ASC;

-- =====================================================
-- VISTA: Historial de Ubicaciones del Pedido
-- =====================================================
CREATE OR REPLACE VIEW vista_tracking_pedido AS
SELECT 
  ur.id,
  ur.pedido_id,
  ur.repartidor_id,
  ur.latitud,
  ur.longitud,
  ur.velocidad,
  ur.precision_metros,
  ur.creado_en,
  
  -- Información del repartidor
  r.nombre_completo as repartidor_nombre,
  r.tipo_vehiculo,
  
  -- Información del pedido
  p.estado as pedido_estado,
  p.direccion_entrega,
  p.latitud as destino_latitud,
  p.longitud as destino_longitud

FROM ubicaciones_repartidor ur
INNER JOIN repartidores r ON ur.repartidor_id = r.id
INNER JOIN pedidos p ON ur.pedido_id = p.id
ORDER BY ur.creado_en DESC;

-- =====================================================
-- VISTA: Última Ubicación del Repartidor por Pedido
-- =====================================================
CREATE OR REPLACE VIEW vista_ubicacion_actual_pedido AS
SELECT DISTINCT ON (ur.pedido_id)
  ur.pedido_id,
  ur.repartidor_id,
  ur.latitud as repartidor_latitud,
  ur.longitud as repartidor_longitud,
  ur.velocidad,
  ur.creado_en as ultima_actualizacion,
  
  -- Información del pedido
  p.estado,
  p.latitud as cliente_latitud,
  p.longitud as cliente_longitud,
  p.direccion_entrega,
  
  -- Información del repartidor
  r.nombre_completo as repartidor_nombre,
  r.telefono as repartidor_telefono,
  r.tipo_vehiculo,
  
  -- Tiempo desde última actualización
  EXTRACT(EPOCH FROM (NOW() - ur.creado_en)) as segundos_desde_actualizacion

FROM ubicaciones_repartidor ur
INNER JOIN pedidos p ON ur.pedido_id = p.id
INNER JOIN repartidores r ON ur.repartidor_id = r.id
WHERE p.estado = 'en_camino'
ORDER BY ur.pedido_id, ur.creado_en DESC;

-- =====================================================
-- VISTA: Estadísticas del Repartidor
-- =====================================================
CREATE OR REPLACE VIEW vista_estadisticas_repartidor AS
SELECT 
  r.id as repartidor_id,
  r.usuario_id,
  r.nombre_completo,
  r.total_entregas,
  r.calificacion_promedio,
  
  -- Estadísticas de pedidos
  (SELECT COUNT(*) FROM pedidos p WHERE p.repartidor_id = r.usuario_id AND p.estado = 'entregado') as entregas_completadas,
  (SELECT COUNT(*) FROM pedidos p WHERE p.repartidor_id = r.usuario_id AND p.estado = 'en_camino') as entregas_en_curso,
  
  -- Ganancias estimadas (si aplica)
  (SELECT COALESCE(SUM(p.total * 0.15), 0) FROM pedidos p WHERE p.repartidor_id = r.usuario_id AND p.estado = 'entregado') as ganancias_estimadas,
  
  -- Última entrega
  (SELECT MAX(p.entregado_en) FROM pedidos p WHERE p.repartidor_id = r.usuario_id AND p.estado = 'entregado') as ultima_entrega_en

FROM repartidores r;

-- =====================================================
-- VISTA: Resumen del Carrito
-- =====================================================
CREATE OR REPLACE VIEW vista_resumen_carrito AS
SELECT 
  c.usuario_id,
  c.restaurante_id,
  r.nombre as restaurante_nombre,
  r.emoji as restaurante_emoji,
  
  -- Totales
  COUNT(c.id) as total_items,
  SUM(c.cantidad) as cantidad_total,
  SUM(c.cantidad * c.precio_unitario) as total_carrito,
  
  -- Validación
  CASE 
    WHEN COUNT(DISTINCT c.restaurante_id) > 1 THEN false
    ELSE true
  END as un_solo_restaurante

FROM carrito c
LEFT JOIN restaurantes r ON c.restaurante_id = r.id
GROUP BY c.usuario_id, c.restaurante_id, r.nombre, r.emoji;
