-- =====================================================
-- FIX: pedidos_realizados_de_repartidor.total
--      debe guardar costo_envio, NO el total del pedido
-- =====================================================
-- Copia y pega TODO este bloque en Supabase → SQL Editor
-- =====================================================


-- -------------------------------------------------------
-- PASO 1: Desactivar cualquier trigger que esté haciendo
--         el INSERT con el total incorrecto
-- -------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT trigger_name, event_object_table
    FROM information_schema.triggers
    WHERE event_object_table = 'pedidos'
      AND trigger_schema = 'public'
  LOOP
    EXECUTE format(
      'ALTER TABLE pedidos DISABLE TRIGGER %I',
      r.trigger_name
    );
    RAISE NOTICE 'Trigger desactivado: %', r.trigger_name;
  END LOOP;
END;
$$;


-- -------------------------------------------------------
-- PASO 2: Reemplazar la función marcar_pedido_entregado
--         para que use costo_envio como total
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION marcar_pedido_entregado(
  p_pedido_id     UUID,
  p_repartidor_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_pedido RECORD;
BEGIN
  -- Leer el pedido
  SELECT *
  INTO   v_pedido
  FROM   pedidos
  WHERE  id            = p_pedido_id
    AND  repartidor_id = p_repartidor_id
    AND  estado        = 'en_camino';

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Marcar como entregado
  UPDATE pedidos
  SET    estado       = 'entregado',
         entregado_en = NOW()
  WHERE  id = p_pedido_id;

  -- Insertar / actualizar en pedidos_realizados_de_repartidor
  -- total = costo_envio  (ganancia del repartidor, NO el total del pedido)
  INSERT INTO pedidos_realizados_de_repartidor (
    pedido_id,
    repartidor_id,
    numero_pedido,
    total,            -- <-- aquí va costo_envio
    direccion_entrega,
    estado,
    entregado_en,
    registrado_en
  )
  VALUES (
    v_pedido.id,
    v_pedido.repartidor_id,
    v_pedido.numero_pedido,
    v_pedido.costo_envio,     -- <-- costo_envio, NO v_pedido.total
    v_pedido.direccion_entrega,
    'entregado',
    NOW(),
    NOW()
  )
  ON CONFLICT (pedido_id) DO UPDATE
    SET total        = v_pedido.costo_envio,
        entregado_en = NOW();

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- -------------------------------------------------------
-- PASO 3: Reactivar los triggers
-- -------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT trigger_name, event_object_table
    FROM information_schema.triggers
    WHERE event_object_table = 'pedidos'
      AND trigger_schema = 'public'
  LOOP
    EXECUTE format(
      'ALTER TABLE pedidos ENABLE TRIGGER %I',
      r.trigger_name
    );
    RAISE NOTICE 'Trigger reactivado: %', r.trigger_name;
  END LOOP;
END;
$$;


-- -------------------------------------------------------
-- PASO 4 (opcional): Corregir registros ya existentes
--         que tengan el total del pedido en vez del costo_envio
-- -------------------------------------------------------
UPDATE pedidos_realizados_de_repartidor prr
SET    total = p.costo_envio
FROM   pedidos p
WHERE  prr.pedido_id = p.id
  AND  prr.total    != p.costo_envio;
