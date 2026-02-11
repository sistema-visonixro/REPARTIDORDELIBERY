-- =====================================================
-- TABLA DE REPARTIDORES
-- =====================================================
-- Almacena información adicional de usuarios que son repartidores

CREATE TABLE IF NOT EXISTS repartidores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL UNIQUE,
  
  -- Información personal
  nombre_completo VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  foto_url TEXT,
  
  -- Información del vehículo
  tipo_vehiculo VARCHAR(50), -- 'bicicleta', 'moto', 'auto', 'a_pie'
  placa_vehiculo VARCHAR(20),
  
  -- Estado del repartidor
  estado VARCHAR(50) DEFAULT 'inactivo', -- 'activo', 'inactivo', 'en_entrega', 'pausado'
  disponible BOOLEAN DEFAULT false,
  
  -- Ubicación actual
  latitud_actual DECIMAL(10,8),
  longitud_actual DECIMAL(11,8),
  ultima_actualizacion_ubicacion TIMESTAMPTZ,
  
  -- Estadísticas
  total_entregas INTEGER DEFAULT 0,
  calificacion_promedio DECIMAL(3,2) DEFAULT 0.00,
  
  -- Timestamps
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_repartidores_usuario ON repartidores(usuario_id);
CREATE INDEX IF NOT EXISTS idx_repartidores_estado ON repartidores(estado);
CREATE INDEX IF NOT EXISTS idx_repartidores_disponible ON repartidores(disponible);
CREATE INDEX IF NOT EXISTS idx_repartidores_ubicacion ON repartidores(latitud_actual, longitud_actual);

-- Constraint para validar estados
ALTER TABLE repartidores
ADD CONSTRAINT check_estado_repartidor 
CHECK (estado IN ('activo', 'inactivo', 'en_entrega', 'pausado'));

-- Constraint para validar tipo de vehículo
ALTER TABLE repartidores
ADD CONSTRAINT check_tipo_vehiculo 
CHECK (tipo_vehiculo IN ('bicicleta', 'moto', 'auto', 'a_pie'));

-- Trigger para actualizar campo actualizado_en
CREATE OR REPLACE FUNCTION actualizar_repartidores_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_repartidores_timestamp
  BEFORE UPDATE ON repartidores
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_repartidores_timestamp();

-- =====================================================
-- TABLA DE UBICACIONES DEL REPARTIDOR (Historial)
-- =====================================================
-- Almacena el historial de ubicaciones del repartidor durante una entrega

CREATE TABLE IF NOT EXISTS ubicaciones_repartidor (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  repartidor_id UUID NOT NULL REFERENCES repartidores(id) ON DELETE CASCADE,
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  
  latitud DECIMAL(10,8) NOT NULL,
  longitud DECIMAL(11,8) NOT NULL,
  
  -- Información adicional
  velocidad DECIMAL(5,2), -- km/h
  precision_metros INTEGER,
  
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ubicaciones_repartidor ON ubicaciones_repartidor(repartidor_id);
CREATE INDEX IF NOT EXISTS idx_ubicaciones_pedido ON ubicaciones_repartidor(pedido_id);
CREATE INDEX IF NOT EXISTS idx_ubicaciones_creado ON ubicaciones_repartidor(creado_en DESC);

-- =====================================================
-- POLÍTICAS RLS PARA REPARTIDORES
-- =====================================================
ALTER TABLE repartidores ENABLE ROW LEVEL SECURITY;

-- Los repartidores pueden ver su propia información
CREATE POLICY "Repartidores pueden ver su perfil"
  ON repartidores FOR SELECT
  USING (auth.uid() = usuario_id);

-- Los clientes pueden ver información básica de repartidores
CREATE POLICY "Clientes pueden ver repartidores asignados"
  ON repartidores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pedidos p
      WHERE p.repartidor_id = repartidores.usuario_id
      AND p.usuario_id = auth.uid()
    )
  );

-- Los repartidores pueden actualizar su perfil
CREATE POLICY "Repartidores pueden actualizar su perfil"
  ON repartidores FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

-- Permitir insertar nuevos repartidores
CREATE POLICY "Usuarios pueden registrarse como repartidores"
  ON repartidores FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- =====================================================
-- POLÍTICAS RLS PARA UBICACIONES_REPARTIDOR
-- =====================================================
ALTER TABLE ubicaciones_repartidor ENABLE ROW LEVEL SECURITY;

-- Los repartidores pueden insertar sus ubicaciones
CREATE POLICY "Repartidores pueden insertar ubicaciones"
  ON ubicaciones_repartidor FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM repartidores r
      WHERE r.id = ubicaciones_repartidor.repartidor_id
      AND r.usuario_id = auth.uid()
    )
  );

-- Los clientes pueden ver ubicaciones de su pedido activo
CREATE POLICY "Clientes pueden ver ubicación de su pedido"
  ON ubicaciones_repartidor FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pedidos p
      WHERE p.id = ubicaciones_repartidor.pedido_id
      AND p.usuario_id = auth.uid()
      AND p.estado = 'en_camino'
    )
  );

-- Los repartidores pueden ver sus propias ubicaciones
CREATE POLICY "Repartidores pueden ver sus ubicaciones"
  ON ubicaciones_repartidor FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM repartidores r
      WHERE r.id = ubicaciones_repartidor.repartidor_id
      AND r.usuario_id = auth.uid()
    )
  );

-- =====================================================
-- VISTA PARA REPARTIDORES DISPONIBLES
-- =====================================================
CREATE OR REPLACE VIEW vista_repartidores_disponibles AS
SELECT 
  r.id,
  r.usuario_id,
  r.nombre_completo,
  r.telefono,
  r.foto_url,
  r.tipo_vehiculo,
  r.estado,
  r.disponible,
  r.latitud_actual,
  r.longitud_actual,
  r.ultima_actualizacion_ubicacion,
  r.total_entregas,
  r.calificacion_promedio,
  
  -- Pedido actual si está en entrega
  (
    SELECT p.id 
    FROM pedidos p 
    WHERE p.repartidor_id = r.usuario_id 
    AND p.estado = 'en_camino'
    LIMIT 1
  ) as pedido_actual_id
FROM repartidores r
WHERE r.disponible = true AND r.estado = 'activo';

-- =====================================================
-- FUNCIONES AUXILIARES PARA REPARTIDORES
-- =====================================================

-- Función para actualizar ubicación del repartidor
CREATE OR REPLACE FUNCTION actualizar_ubicacion_repartidor(
  p_repartidor_id UUID,
  p_latitud DECIMAL(10,8),
  p_longitud DECIMAL(11,8),
  p_pedido_id UUID DEFAULT NULL,
  p_velocidad DECIMAL(5,2) DEFAULT NULL,
  p_precision INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Actualizar ubicación en tabla repartidores
  UPDATE repartidores
  SET latitud_actual = p_latitud,
      longitud_actual = p_longitud,
      ultima_actualizacion_ubicacion = NOW()
  WHERE id = p_repartidor_id;
  
  -- Si hay un pedido activo, guardar en historial
  IF p_pedido_id IS NOT NULL THEN
    INSERT INTO ubicaciones_repartidor (
      repartidor_id,
      pedido_id,
      latitud,
      longitud,
      velocidad,
      precision_metros
    ) VALUES (
      p_repartidor_id,
      p_pedido_id,
      p_latitud,
      p_longitud,
      p_velocidad,
      p_precision
    );
  END IF;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para cambiar disponibilidad del repartidor
CREATE OR REPLACE FUNCTION cambiar_disponibilidad_repartidor(
  p_usuario_id UUID,
  p_disponible BOOLEAN
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE repartidores
  SET disponible = p_disponible,
      estado = CASE 
        WHEN p_disponible THEN 'activo'
        ELSE 'inactivo'
      END
  WHERE usuario_id = p_usuario_id
    AND NOT EXISTS (
      SELECT 1 FROM pedidos p
      WHERE p.repartidor_id = p_usuario_id
      AND p.estado = 'en_camino'
    );
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener repartidores cercanos
CREATE OR REPLACE FUNCTION obtener_repartidores_cercanos(
  p_latitud DECIMAL(10,8),
  p_longitud DECIMAL(11,8),
  p_radio_km INTEGER DEFAULT 5
)
RETURNS TABLE (
  repartidor_id UUID,
  nombre_completo VARCHAR(255),
  tipo_vehiculo VARCHAR(50),
  distancia_km DECIMAL(10,2),
  calificacion_promedio DECIMAL(3,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.nombre_completo,
    r.tipo_vehiculo,
    -- Fórmula de Haversine simplificada para distancia aproximada
    (6371 * acos(
      cos(radians(p_latitud)) * 
      cos(radians(r.latitud_actual)) * 
      cos(radians(r.longitud_actual) - radians(p_longitud)) + 
      sin(radians(p_latitud)) * 
      sin(radians(r.latitud_actual))
    ))::DECIMAL(10,2) AS distancia_km,
    r.calificacion_promedio
  FROM repartidores r
  WHERE r.disponible = true
    AND r.estado = 'activo'
    AND r.latitud_actual IS NOT NULL
    AND r.longitud_actual IS NOT NULL
  HAVING distancia_km <= p_radio_km
  ORDER BY distancia_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Función para incrementar estadísticas de repartidor
CREATE OR REPLACE FUNCTION incrementar_entregas_repartidor(
  p_usuario_id UUID
)
RETURNS void AS $$
BEGIN
  UPDATE repartidores
  SET total_entregas = total_entregas + 1,
      estado = 'activo',
      disponible = true
  WHERE usuario_id = p_usuario_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
