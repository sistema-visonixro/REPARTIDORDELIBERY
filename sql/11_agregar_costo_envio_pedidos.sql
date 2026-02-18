-- =====================================================
-- AGREGAR costo_envio A TABLA pedidos
-- =====================================================

-- 1. Agregar columna costo_envio a pedidos
ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS costo_envio DECIMAL(10,2) NOT NULL DEFAULT 0.00;

COMMENT ON COLUMN pedidos.costo_envio IS 'Costo de envío a cobrar al cliente. Este valor es la ganancia del repartidor.';

-- 2. Agregar columna costo_envio a pedidos_realizados_de_repartidor
--    (si la tabla ya existe; si no existe, se crea abajo)
ALTER TABLE pedidos_realizados_de_repartidor
ADD COLUMN IF NOT EXISTS costo_envio DECIMAL(10,2) NOT NULL DEFAULT 0.00;

COMMENT ON COLUMN pedidos_realizados_de_repartidor.costo_envio IS 'Ganancia del repartidor por esta entrega (= costo_envio del pedido).';

-- 3. Actualizar la función marcar_pedido_entregado para insertar
--    en pedidos_realizados_de_repartidor usando costo_envio como total
CREATE OR REPLACE FUNCTION marcar_pedido_entregado(
  p_pedido_id   UUID,
  p_repartidor_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_pedido RECORD;
BEGIN
  -- Obtener datos del pedido antes de actualizar
  SELECT p.*, r.id AS repartidor_row_id
  INTO v_pedido
  FROM pedidos p
  JOIN repartidores r ON r.id = p_repartidor_id OR r.usuario_id = p_repartidor_id
  WHERE p.id = p_pedido_id
    AND p.repartidor_id = p_repartidor_id
    AND p.estado = 'en_camino'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Marcar pedido como entregado
  UPDATE pedidos
  SET estado       = 'entregado',
      entregado_en = NOW()
  WHERE id           = p_pedido_id
    AND repartidor_id = p_repartidor_id
    AND estado        = 'en_camino';

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Registrar en pedidos_realizados_de_repartidor
  -- total = costo_envio (ganancia del repartidor)
  INSERT INTO pedidos_realizados_de_repartidor (
    pedido_id,
    repartidor_id,
    numero_pedido,
    total,
    costo_envio,
    direccion_entrega,
    estado,
    entregado_en,
    registrado_en
  )
  VALUES (
    v_pedido.id,
    v_pedido.repartidor_row_id,
    v_pedido.numero_pedido,
    v_pedido.costo_envio,           -- total = ganancia del repartidor
    v_pedido.costo_envio,
    v_pedido.direccion_entrega,
    'entregado',
    NOW(),
    NOW()
  )
  ON CONFLICT (pedido_id) DO UPDATE
    SET entregado_en  = NOW(),
        total         = EXCLUDED.total,
        costo_envio   = EXCLUDED.costo_envio;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
