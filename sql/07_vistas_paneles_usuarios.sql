-- =====================================================
-- VISTAS TIPO PANEL PARA DIFERENTES TIPOS DE USUARIOS
-- Sistema Delibery
-- =====================================================

-- =====================================================
-- VISTA PANEL REPARTIDOR
-- =====================================================
-- Información general del repartidor y sus estadísticas

CREATE OR REPLACE VIEW vista_panel_repartidor AS
SELECT 
  r.id AS repartidor_id,
  r.usuario_id,
  r.nombre_completo,
  r.telefono,
  r.foto_url,
  r.tipo_vehiculo,
  r.estado,
  r.disponible,
  r.latitud_actual,
  r.longitud_actual,
  r.total_entregas,
  r.calificacion_promedio,
  
  -- Estadísticas del día actual
  COUNT(DISTINCT CASE 
    WHEN p.creado_en::date = CURRENT_DATE 
    AND p.estado = 'entregado' 
    THEN p.id 
  END) AS entregas_hoy,
  
  COALESCE(SUM(CASE 
    WHEN p.creado_en::date = CURRENT_DATE 
    AND p.estado = 'entregado' 
    THEN p.total * 0.15  -- 15% comisión por entrega
  END), 0) AS ganancias_hoy,
  
  -- Estadísticas del mes actual
  COUNT(DISTINCT CASE 
    WHEN DATE_TRUNC('month', p.creado_en) = DATE_TRUNC('month', CURRENT_DATE)
    AND p.estado = 'entregado' 
    THEN p.id 
  END) AS entregas_mes,
  
  COALESCE(SUM(CASE 
    WHEN DATE_TRUNC('month', p.creado_en) = DATE_TRUNC('month', CURRENT_DATE)
    AND p.estado = 'entregado' 
    THEN p.total * 0.15
  END), 0) AS ganancias_mes,
  
  -- Pedido activo actual
  (SELECT json_build_object(
    'pedido_id', pa.id,
    'numero_pedido', pa.numero_pedido,
    'estado', pa.estado,
    'restaurante', rest.nombre,
    'direccion_entrega', pa.direccion_entrega,
    'total', pa.total,
    'tiempo_transcurrido', EXTRACT(EPOCH FROM (NOW() - pa.asignado_en))/60
  )
  FROM pedidos pa
  JOIN restaurantes rest ON pa.restaurante_id = rest.id
  WHERE pa.repartidor_id = r.usuario_id 
  AND pa.estado IN ('en_camino', 'listo')
  ORDER BY pa.asignado_en DESC
  LIMIT 1
  ) AS pedido_activo,
  
  r.creado_en,
  r.actualizado_en
FROM repartidores r
LEFT JOIN pedidos p ON p.repartidor_id = r.usuario_id
GROUP BY r.id, r.usuario_id, r.nombre_completo, r.telefono, r.foto_url, 
         r.tipo_vehiculo, r.estado, r.disponible, r.latitud_actual, 
         r.longitud_actual, r.total_entregas, r.calificacion_promedio,
         r.creado_en, r.actualizado_en;

-- =====================================================
-- VISTA PANEL RESTAURANTE
-- =====================================================
-- Dashboard completo para restaurantes

CREATE OR REPLACE VIEW vista_panel_restaurante AS
SELECT 
  rest.id AS restaurante_id,
  rest.nombre,
  rest.descripcion,
  rest.imagen_url,
  rest.color_tema,
  rest.emoji,
  rest.calificacion,
  rest.tiempo_entrega_min,
  rest.costo_envio,
  rest.activo,
  
  -- Estadísticas del día
  COUNT(DISTINCT CASE 
    WHEN p.creado_en::date = CURRENT_DATE 
    THEN p.id 
  END) AS pedidos_hoy,
  
  COUNT(DISTINCT CASE 
    WHEN p.creado_en::date = CURRENT_DATE 
    AND p.estado = 'pendiente'
    THEN p.id 
  END) AS pedidos_pendientes_hoy,
  
  COUNT(DISTINCT CASE 
    WHEN p.creado_en::date = CURRENT_DATE 
    AND p.estado IN ('confirmado', 'en_preparacion')
    THEN p.id 
  END) AS pedidos_en_proceso_hoy,
  
  COUNT(DISTINCT CASE 
    WHEN p.creado_en::date = CURRENT_DATE 
    AND p.estado = 'entregado'
    THEN p.id 
  END) AS pedidos_completados_hoy,
  
  COALESCE(SUM(CASE 
    WHEN p.creado_en::date = CURRENT_DATE 
    AND p.estado = 'entregado'
    THEN p.total 
  END), 0) AS ingresos_hoy,
  
  -- Estadísticas del mes
  COUNT(DISTINCT CASE 
    WHEN DATE_TRUNC('month', p.creado_en) = DATE_TRUNC('month', CURRENT_DATE)
    THEN p.id 
  END) AS pedidos_mes,
  
  COUNT(DISTINCT CASE 
    WHEN DATE_TRUNC('month', p.creado_en) = DATE_TRUNC('month', CURRENT_DATE)
    AND p.estado = 'entregado'
    THEN p.id 
  END) AS pedidos_completados_mes,
  
  COALESCE(SUM(CASE 
    WHEN DATE_TRUNC('month', p.creado_en) = DATE_TRUNC('month', CURRENT_DATE)
    AND p.estado = 'entregado'
    THEN p.total 
  END), 0) AS ingresos_mes,
  
  -- Estadísticas de productos
  (SELECT COUNT(*) FROM platillos WHERE restaurante_id = rest.id) AS total_platillos,
  (SELECT COUNT(*) FROM platillos WHERE restaurante_id = rest.id AND disponible = true) AS platillos_disponibles,
  (SELECT COUNT(*) FROM bebidas WHERE restaurante_id = rest.id) AS total_bebidas,
  (SELECT COUNT(*) FROM bebidas WHERE restaurante_id = rest.id AND disponible = true) AS bebidas_disponibles,
  
  -- Pedidos pendientes de confirmación
  (SELECT json_agg(
    json_build_object(
      'pedido_id', pp.id,
      'numero_pedido', pp.numero_pedido,
      'total', pp.total,
      'estado', pp.estado,
      'creado_en', pp.creado_en,
      'direccion_entrega', pp.direccion_entrega
    ) ORDER BY pp.creado_en DESC
  )
  FROM pedidos pp
  WHERE pp.restaurante_id = rest.id 
  AND pp.estado = 'pendiente'
  ) AS pedidos_pendientes,
  
  -- Platillo más vendido
  (SELECT json_build_object(
    'platillo_id', plat.id,
    'nombre', plat.nombre,
    'precio', plat.precio,
    'veces_pedido', COUNT(dp.id)
  )
  FROM platillos plat
  JOIN detalle_pedidos dp ON dp.platillo_id = plat.id
  JOIN pedidos ped ON ped.id = dp.pedido_id
  WHERE plat.restaurante_id = rest.id
  AND ped.estado = 'entregado'
  AND DATE_TRUNC('month', ped.creado_en) = DATE_TRUNC('month', CURRENT_DATE)
  GROUP BY plat.id, plat.nombre, plat.precio
  ORDER BY COUNT(dp.id) DESC
  LIMIT 1
  ) AS platillo_mas_vendido,
  
  rest.created_at,
  rest.updated_at
FROM restaurantes rest
LEFT JOIN pedidos p ON p.restaurante_id = rest.id
GROUP BY rest.id, rest.nombre, rest.descripcion, rest.imagen_url, 
         rest.color_tema, rest.emoji, rest.calificacion, 
         rest.tiempo_entrega_min, rest.costo_envio, rest.activo,
         rest.created_at, rest.updated_at;

-- =====================================================
-- VISTA PANEL OPERADOR
-- =====================================================
-- Vista general del sistema para operadores

CREATE OR REPLACE VIEW vista_panel_operador AS
SELECT 
  -- Pedidos en tiempo real
  COUNT(DISTINCT CASE WHEN p.estado = 'pendiente' THEN p.id END) AS pedidos_pendientes,
  COUNT(DISTINCT CASE WHEN p.estado = 'confirmado' THEN p.id END) AS pedidos_confirmados,
  COUNT(DISTINCT CASE WHEN p.estado = 'en_preparacion' THEN p.id END) AS pedidos_en_preparacion,
  COUNT(DISTINCT CASE WHEN p.estado = 'listo' THEN p.id END) AS pedidos_listos,
  COUNT(DISTINCT CASE WHEN p.estado = 'en_camino' THEN p.id END) AS pedidos_en_camino,
  COUNT(DISTINCT CASE WHEN p.estado = 'entregado' AND p.creado_en::date = CURRENT_DATE THEN p.id END) AS pedidos_entregados_hoy,
  COUNT(DISTINCT CASE WHEN p.estado = 'cancelado' AND p.creado_en::date = CURRENT_DATE THEN p.id END) AS pedidos_cancelados_hoy,
  
  -- Estadísticas de repartidores
  COUNT(DISTINCT CASE WHEN r.disponible = true THEN r.id END) AS repartidores_disponibles,
  COUNT(DISTINCT CASE WHEN r.estado = 'en_entrega' THEN r.id END) AS repartidores_en_entrega,
  COUNT(DISTINCT CASE WHEN r.estado = 'activo' THEN r.id END) AS repartidores_activos,
  COUNT(DISTINCT r.id) AS total_repartidores,
  
  -- Estadísticas de restaurantes
  COUNT(DISTINCT CASE WHEN rest.activo = true THEN rest.id END) AS restaurantes_activos,
  COUNT(DISTINCT rest.id) AS total_restaurantes,
  
  -- Métricas del día
  COALESCE(SUM(CASE WHEN p.estado = 'entregado' AND p.creado_en::date = CURRENT_DATE THEN p.total END), 0) AS ingresos_hoy,
  COALESCE(AVG(CASE 
    WHEN p.estado = 'entregado' 
    AND p.creado_en::date = CURRENT_DATE 
    THEN EXTRACT(EPOCH FROM (p.entregado_en - p.creado_en))/60 
  END), 0) AS tiempo_promedio_entrega_hoy,
  
  -- Métricas del mes
  COUNT(DISTINCT CASE 
    WHEN p.estado = 'entregado' 
    AND DATE_TRUNC('month', p.creado_en) = DATE_TRUNC('month', CURRENT_DATE)
    THEN p.id 
  END) AS pedidos_completados_mes,
  
  COALESCE(SUM(CASE 
    WHEN p.estado = 'entregado' 
    AND DATE_TRUNC('month', p.creado_en) = DATE_TRUNC('month', CURRENT_DATE)
    THEN p.total 
  END), 0) AS ingresos_mes,
  
  -- Alertas y problemas
  COUNT(DISTINCT CASE 
    WHEN p.estado IN ('pendiente', 'confirmado', 'en_preparacion') 
    AND EXTRACT(EPOCH FROM (NOW() - p.creado_en))/60 > 30 
    THEN p.id 
  END) AS pedidos_retrasados,
  
  COUNT(DISTINCT CASE 
    WHEN p.estado = 'listo' 
    AND p.repartidor_id IS NULL 
    THEN p.id 
  END) AS pedidos_sin_repartidor,
  
  -- Lista de pedidos activos urgentes
  (SELECT json_agg(
    json_build_object(
      'pedido_id', pa.id,
      'numero_pedido', pa.numero_pedido,
      'restaurante', rest.nombre,
      'estado', pa.estado,
      'tiempo_transcurrido', EXTRACT(EPOCH FROM (NOW() - pa.creado_en))/60,
      'tiene_repartidor', pa.repartidor_id IS NOT NULL
    ) ORDER BY pa.creado_en ASC
  )
  FROM pedidos pa
  JOIN restaurantes rest ON pa.restaurante_id = rest.id
  WHERE pa.estado IN ('pendiente', 'confirmado', 'en_preparacion', 'listo')
  AND EXTRACT(EPOCH FROM (NOW() - pa.creado_en))/60 > 20
  LIMIT 10
  ) AS pedidos_urgentes,
  
  NOW() AS actualizado_en
FROM pedidos p
FULL OUTER JOIN repartidores r ON true
FULL OUTER JOIN restaurantes rest ON true;

-- =====================================================
-- VISTA PANEL ADMINISTRADOR
-- =====================================================
-- Vista completa del sistema con todas las métricas

CREATE OR REPLACE VIEW vista_panel_admin AS
SELECT 
  -- Usuarios del sistema
  (SELECT COUNT(*) FROM auth.users) AS total_usuarios,
  (SELECT COUNT(*) FROM auth.users WHERE created_at::date = CURRENT_DATE) AS usuarios_nuevos_hoy,
  (SELECT COUNT(*) FROM auth.users WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) AS usuarios_nuevos_mes,
  
  -- Estadísticas de pedidos globales
  COUNT(DISTINCT p.id) AS total_pedidos_historico,
  COUNT(DISTINCT CASE WHEN p.creado_en::date = CURRENT_DATE THEN p.id END) AS pedidos_hoy,
  COUNT(DISTINCT CASE WHEN DATE_TRUNC('month', p.creado_en) = DATE_TRUNC('month', CURRENT_DATE) THEN p.id END) AS pedidos_mes,
  COUNT(DISTINCT CASE WHEN p.estado = 'entregado' THEN p.id END) AS total_pedidos_completados,
  COUNT(DISTINCT CASE WHEN p.estado = 'cancelado' THEN p.id END) AS total_pedidos_cancelados,
  
  -- Tasa de conversión
  CASE 
    WHEN COUNT(DISTINCT p.id) > 0 
    THEN ROUND((COUNT(DISTINCT CASE WHEN p.estado = 'entregado' THEN p.id END)::numeric / COUNT(DISTINCT p.id)::numeric * 100), 2)
    ELSE 0 
  END AS tasa_completacion_porcentaje,
  
  -- Ingresos totales
  COALESCE(SUM(CASE WHEN p.estado = 'entregado' THEN p.total END), 0) AS ingresos_totales,
  COALESCE(SUM(CASE WHEN p.estado = 'entregado' AND p.creado_en::date = CURRENT_DATE THEN p.total END), 0) AS ingresos_hoy,
  COALESCE(SUM(CASE WHEN p.estado = 'entregado' AND DATE_TRUNC('month', p.creado_en) = DATE_TRUNC('month', CURRENT_DATE) THEN p.total END), 0) AS ingresos_mes,
  COALESCE(AVG(CASE WHEN p.estado = 'entregado' THEN p.total END), 0) AS ticket_promedio,
  
  -- Tiempos promedios
  COALESCE(AVG(CASE 
    WHEN p.estado = 'entregado' 
    THEN EXTRACT(EPOCH FROM (p.entregado_en - p.creado_en))/60 
  END), 0) AS tiempo_promedio_entrega_global,
  
  COALESCE(AVG(CASE 
    WHEN p.estado = 'entregado' 
    AND p.creado_en::date = CURRENT_DATE
    THEN EXTRACT(EPOCH FROM (p.entregado_en - p.creado_en))/60 
  END), 0) AS tiempo_promedio_entrega_hoy,
  
  -- Estadísticas de restaurantes
  (SELECT COUNT(*) FROM restaurantes) AS total_restaurantes,
  (SELECT COUNT(*) FROM restaurantes WHERE activo = true) AS restaurantes_activos,
  (SELECT COUNT(*) FROM platillos) AS total_platillos,
  (SELECT COUNT(*) FROM bebidas) AS total_bebidas,
  
  -- Estadísticas de repartidores
  (SELECT COUNT(*) FROM repartidores) AS total_repartidores,
  (SELECT COUNT(*) FROM repartidores WHERE disponible = true) AS repartidores_disponibles,
  (SELECT COUNT(*) FROM repartidores WHERE estado = 'en_entrega') AS repartidores_en_entrega,
  (SELECT COALESCE(AVG(calificacion_promedio), 0) FROM repartidores) AS calificacion_promedio_repartidores,
  
  -- Top 5 restaurantes por ventas del mes
  (SELECT json_agg(row_to_json(top_rest))
  FROM (
    SELECT 
      rest.id,
      rest.nombre,
      rest.emoji,
      COUNT(DISTINCT p2.id) AS total_pedidos,
      COALESCE(SUM(CASE WHEN p2.estado = 'entregado' THEN p2.total END), 0) AS ingresos
    FROM restaurantes rest
    LEFT JOIN pedidos p2 ON p2.restaurante_id = rest.id
      AND DATE_TRUNC('month', p2.creado_en) = DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY rest.id, rest.nombre, rest.emoji
    ORDER BY ingresos DESC
    LIMIT 5
  ) top_rest
  ) AS top_restaurantes_mes,
  
  -- Top 5 repartidores del mes
  (SELECT json_agg(row_to_json(top_rep))
  FROM (
    SELECT 
      r2.id,
      r2.nombre_completo,
      r2.calificacion_promedio,
      COUNT(DISTINCT p3.id) AS entregas_mes,
      COALESCE(SUM(CASE WHEN p3.estado = 'entregado' THEN p3.total * 0.15 END), 0) AS ganancias_mes
    FROM repartidores r2
    LEFT JOIN pedidos p3 ON p3.repartidor_id = r2.usuario_id
      AND p3.estado = 'entregado'
      AND DATE_TRUNC('month', p3.creado_en) = DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY r2.id, r2.nombre_completo, r2.calificacion_promedio
    ORDER BY entregas_mes DESC
    LIMIT 5
  ) top_rep
  ) AS top_repartidores_mes,
  
  -- Distribución por estado actual
  json_build_object(
    'pendiente', COUNT(DISTINCT CASE WHEN p.estado = 'pendiente' THEN p.id END),
    'confirmado', COUNT(DISTINCT CASE WHEN p.estado = 'confirmado' THEN p.id END),
    'en_preparacion', COUNT(DISTINCT CASE WHEN p.estado = 'en_preparacion' THEN p.id END),
    'listo', COUNT(DISTINCT CASE WHEN p.estado = 'listo' THEN p.id END),
    'en_camino', COUNT(DISTINCT CASE WHEN p.estado = 'en_camino' THEN p.id END),
    'entregado', COUNT(DISTINCT CASE WHEN p.estado = 'entregado' THEN p.id END),
    'cancelado', COUNT(DISTINCT CASE WHEN p.estado = 'cancelado' THEN p.id END)
  ) AS distribucion_estados,
  
  -- Ventas por hora del día (últimas 24h)
  (SELECT json_agg(
    json_build_object(
      'hora', EXTRACT(HOUR FROM ph.creado_en),
      'pedidos', COUNT(DISTINCT ph.id),
      'ingresos', COALESCE(SUM(CASE WHEN ph.estado = 'entregado' THEN ph.total END), 0)
    )
  )
  FROM pedidos ph
  WHERE ph.creado_en >= NOW() - INTERVAL '24 hours'
  GROUP BY EXTRACT(HOUR FROM ph.creado_en)
  ORDER BY EXTRACT(HOUR FROM ph.creado_en)
  ) AS ventas_por_hora,
  
  NOW() AS actualizado_en
FROM pedidos p;

-- =====================================================
-- PERMISOS RLS PARA LAS VISTAS
-- =====================================================

-- Habilitar RLS en las vistas
ALTER VIEW vista_panel_repartidor SET (security_invoker = on);
ALTER VIEW vista_panel_restaurante SET (security_invoker = on);
ALTER VIEW vista_panel_operador SET (security_invoker = on);
ALTER VIEW vista_panel_admin SET (security_invoker = on);

-- =====================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================

COMMENT ON VIEW vista_panel_repartidor IS 'Panel de control para repartidores con estadísticas personales y pedido activo';
COMMENT ON VIEW vista_panel_restaurante IS 'Panel de control para restaurantes con métricas de ventas y pedidos pendientes';
COMMENT ON VIEW vista_panel_operador IS 'Panel de control para operadores con vista general del sistema en tiempo real';
COMMENT ON VIEW vista_panel_admin IS 'Panel de control administrativo con todas las métricas y estadísticas del sistema';

-- =====================================================
-- ÍNDICES ADICIONALES PARA MEJORAR RENDIMIENTO
-- =====================================================

-- Ya deberían existir de scripts anteriores, pero por si acaso:
CREATE INDEX IF NOT EXISTS idx_pedidos_creado_estado ON pedidos(creado_en DESC, estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_restaurante_estado ON pedidos(restaurante_id, estado);
CREATE INDEX IF NOT EXISTS idx_repartidores_usuario_disponible ON repartidores(usuario_id, disponible);
CREATE INDEX IF NOT EXISTS idx_detalle_pedidos_platillo ON detalle_pedidos(platillo_id);
