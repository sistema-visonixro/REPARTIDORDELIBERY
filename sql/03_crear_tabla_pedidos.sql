-- =====================================================
-- TABLA DE PEDIDOS
-- =====================================================
-- Almacena los pedidos realizados por los clientes

CREATE TABLE IF NOT EXISTS pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL,
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  repartidor_id UUID,
  
  -- Información del pedido
  numero_pedido VARCHAR(50) UNIQUE NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  
  -- Estados del pedido
  estado VARCHAR(50) NOT NULL DEFAULT 'pendiente',
  -- Estados posibles: 'pendiente', 'confirmado', 'en_preparacion', 'listo', 'en_camino', 'entregado', 'cancelado'
  
  -- Información de entrega
  direccion_entrega TEXT NOT NULL,
  latitud DECIMAL(10,8),
  longitud DECIMAL(11,8),
  
  -- Notas adicionales
  notas_cliente TEXT,
  notas_repartidor TEXT,
  
  -- Timestamps
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  confirmado_en TIMESTAMPTZ,
  asignado_en TIMESTAMPTZ,
  entregado_en TIMESTAMPTZ,
  cancelado_en TIMESTAMPTZ,
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_restaurante ON pedidos(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_repartidor ON pedidos(repartidor_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_numero ON pedidos(numero_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_creado ON pedidos(creado_en DESC);

-- Constraint para validar estados
ALTER TABLE pedidos
ADD CONSTRAINT check_estado_pedido 
CHECK (estado IN ('pendiente', 'confirmado', 'en_preparacion', 'listo', 'en_camino', 'entregado', 'cancelado'));

-- Trigger para actualizar campo actualizado_en
CREATE OR REPLACE FUNCTION actualizar_pedidos_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  
  -- Actualizar timestamps según estado
  IF NEW.estado = 'confirmado' AND OLD.estado != 'confirmado' THEN
    NEW.confirmado_en = NOW();
  END IF;
  
  IF NEW.repartidor_id IS NOT NULL AND OLD.repartidor_id IS NULL THEN
    NEW.asignado_en = NOW();
  END IF;
  
  IF NEW.estado = 'entregado' AND OLD.estado != 'entregado' THEN
    NEW.entregado_en = NOW();
  END IF;
  
  IF NEW.estado = 'cancelado' AND OLD.estado != 'cancelado' THEN
    NEW.cancelado_en = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_pedidos_timestamp
  BEFORE UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_pedidos_timestamp();

-- Función para generar número de pedido único
CREATE OR REPLACE FUNCTION generar_numero_pedido()
RETURNS VARCHAR(50) AS $$
DECLARE
  nuevo_numero VARCHAR(50);
  existe BOOLEAN;
BEGIN
  LOOP
    nuevo_numero := 'PED-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    SELECT EXISTS(SELECT 1 FROM pedidos WHERE numero_pedido = nuevo_numero) INTO existe;
    EXIT WHEN NOT existe;
  END LOOP;
  RETURN nuevo_numero;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TABLA DE DETALLE DE PEDIDOS
-- =====================================================
-- Almacena los platillos incluidos en cada pedido

CREATE TABLE IF NOT EXISTS detalle_pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  platillo_id UUID NOT NULL REFERENCES platillos(id) ON DELETE CASCADE,
  
  cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  
  notas TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_detalle_pedido ON detalle_pedidos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_detalle_platillo ON detalle_pedidos(platillo_id);

-- =====================================================
-- POLÍTICAS RLS PARA PEDIDOS
-- =====================================================
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver sus propios pedidos
CREATE POLICY "Usuarios pueden ver sus pedidos"
  ON pedidos FOR SELECT
  USING (auth.uid() = usuario_id);

-- Los repartidores pueden ver pedidos asignados a ellos
CREATE POLICY "Repartidores pueden ver sus pedidos asignados"
  ON pedidos FOR SELECT
  USING (auth.uid() = repartidor_id);

-- Los usuarios pueden crear pedidos
CREATE POLICY "Usuarios pueden crear pedidos"
  ON pedidos FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- Los usuarios pueden actualizar sus pedidos (solo ciertas acciones)
CREATE POLICY "Usuarios pueden actualizar sus pedidos"
  ON pedidos FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

-- Los repartidores pueden actualizar pedidos asignados
CREATE POLICY "Repartidores pueden actualizar sus pedidos"
  ON pedidos FOR UPDATE
  USING (auth.uid() = repartidor_id)
  WITH CHECK (auth.uid() = repartidor_id);

-- =====================================================
-- POLÍTICAS RLS PARA DETALLE_PEDIDOS
-- =====================================================
ALTER TABLE detalle_pedidos ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver detalles de sus pedidos
CREATE POLICY "Usuarios pueden ver detalle de sus pedidos"
  ON detalle_pedidos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pedidos p 
      WHERE p.id = detalle_pedidos.pedido_id 
      AND p.usuario_id = auth.uid()
    )
  );

-- Los repartidores pueden ver detalles de pedidos asignados
CREATE POLICY "Repartidores pueden ver detalle de pedidos asignados"
  ON detalle_pedidos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pedidos p 
      WHERE p.id = detalle_pedidos.pedido_id 
      AND p.repartidor_id = auth.uid()
    )
  );

-- Permitir insertar detalles al crear pedidos
CREATE POLICY "Usuarios pueden crear detalle de pedidos"
  ON detalle_pedidos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pedidos p 
      WHERE p.id = detalle_pedidos.pedido_id 
      AND p.usuario_id = auth.uid()
    )
  );

-- =====================================================
-- VISTA PARA PEDIDOS CON INFORMACIÓN COMPLETA
-- =====================================================
CREATE OR REPLACE VIEW vista_pedidos_completa AS
SELECT 
  p.id,
  p.usuario_id,
  p.restaurante_id,
  p.repartidor_id,
  p.numero_pedido,
  p.total,
  p.estado,
  p.direccion_entrega,
  p.latitud,
  p.longitud,
  p.notas_cliente,
  p.notas_repartidor,
  p.creado_en,
  p.confirmado_en,
  p.asignado_en,
  p.entregado_en,
  p.cancelado_en,
  p.actualizado_en,
  
  -- Información del restaurante
  r.nombre as restaurante_nombre,
  r.emoji as restaurante_emoji,
  r.imagen_url as restaurante_imagen,
  
  -- Información del repartidor
  rep.email as repartidor_email,
  
  -- Contador de items
  (SELECT COUNT(*) FROM detalle_pedidos WHERE pedido_id = p.id) as total_items
FROM pedidos p
LEFT JOIN restaurantes r ON p.restaurante_id = r.id
LEFT JOIN auth.users rep ON p.repartidor_id = rep.id;

-- =====================================================
-- FUNCIONES AUXILIARES PARA PEDIDOS
-- =====================================================

-- Función para crear pedido desde carrito
CREATE OR REPLACE FUNCTION crear_pedido_desde_carrito(
  p_usuario_id UUID,
  p_direccion_entrega TEXT,
  p_latitud DECIMAL(10,8),
  p_longitud DECIMAL(11,8),
  p_notas_cliente TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_pedido_id UUID;
  v_restaurante_id UUID;
  v_total DECIMAL(10,2);
  v_numero_pedido VARCHAR(50);
BEGIN
  -- Verificar que hay items en el carrito
  IF NOT EXISTS (SELECT 1 FROM carrito WHERE usuario_id = p_usuario_id) THEN
    RAISE EXCEPTION 'El carrito está vacío';
  END IF;
  
  -- Obtener restaurante (todos los items deben ser del mismo restaurante)
  SELECT DISTINCT restaurante_id INTO v_restaurante_id
  FROM carrito
  WHERE usuario_id = p_usuario_id;
  
  -- Verificar que todos los items son del mismo restaurante
  IF (SELECT COUNT(DISTINCT restaurante_id) FROM carrito WHERE usuario_id = p_usuario_id) > 1 THEN
    RAISE EXCEPTION 'Los items del carrito deben ser del mismo restaurante';
  END IF;
  
  -- Calcular total
  SELECT SUM(cantidad * precio_unitario) INTO v_total
  FROM carrito
  WHERE usuario_id = p_usuario_id;
  
  -- Generar número de pedido
  v_numero_pedido := generar_numero_pedido();
  
  -- Crear pedido
  INSERT INTO pedidos (
    usuario_id,
    restaurante_id,
    numero_pedido,
    total,
    estado,
    direccion_entrega,
    latitud,
    longitud,
    notas_cliente
  ) VALUES (
    p_usuario_id,
    v_restaurante_id,
    v_numero_pedido,
    v_total,
    'pendiente',
    p_direccion_entrega,
    p_latitud,
    p_longitud,
    p_notas_cliente
  )
  RETURNING id INTO v_pedido_id;
  
  -- Copiar items del carrito al detalle del pedido
  INSERT INTO detalle_pedidos (
    pedido_id,
    platillo_id,
    cantidad,
    precio_unitario,
    subtotal,
    notas
  )
  SELECT
    v_pedido_id,
    platillo_id,
    cantidad,
    precio_unitario,
    cantidad * precio_unitario,
    notas
  FROM carrito
  WHERE usuario_id = p_usuario_id;
  
  -- Limpiar carrito
  DELETE FROM carrito WHERE usuario_id = p_usuario_id;
  
  RETURN v_pedido_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para asignar repartidor a pedido
CREATE OR REPLACE FUNCTION asignar_repartidor_pedido(
  p_pedido_id UUID,
  p_repartidor_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE pedidos
  SET repartidor_id = p_repartidor_id,
      estado = 'en_camino',
      asignado_en = NOW()
  WHERE id = p_pedido_id
    AND estado IN ('listo', 'confirmado', 'en_preparacion')
    AND repartidor_id IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para marcar pedido como entregado
CREATE OR REPLACE FUNCTION marcar_pedido_entregado(
  p_pedido_id UUID,
  p_repartidor_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE pedidos
  SET estado = 'entregado',
      entregado_en = NOW()
  WHERE id = p_pedido_id
    AND repartidor_id = p_repartidor_id
    AND estado = 'en_camino';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
