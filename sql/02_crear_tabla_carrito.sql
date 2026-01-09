-- =====================================================
-- TABLA DE CARRITO
-- =====================================================
-- Almacena items temporales que el usuario va agregando antes de confirmar pedido

CREATE TABLE IF NOT EXISTS carrito (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platillo_id UUID NOT NULL REFERENCES platillos(id) ON DELETE CASCADE,
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  precio_unitario DECIMAL(10,2) NOT NULL,
  notas TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_carrito_usuario ON carrito(usuario_id);
CREATE INDEX IF NOT EXISTS idx_carrito_platillo ON carrito(platillo_id);
CREATE INDEX IF NOT EXISTS idx_carrito_restaurante ON carrito(restaurante_id);

-- Trigger para actualizar campo actualizado_en
CREATE OR REPLACE FUNCTION actualizar_carrito_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_carrito_timestamp
  BEFORE UPDATE ON carrito
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_carrito_timestamp();

-- =====================================================
-- POLÍTICAS RLS PARA CARRITO
-- =====================================================
ALTER TABLE carrito ENABLE ROW LEVEL SECURITY;

-- El usuario solo puede ver su propio carrito
CREATE POLICY "Usuarios pueden ver su carrito"
  ON carrito FOR SELECT
  USING (auth.uid() = usuario_id);

-- El usuario solo puede insertar en su propio carrito
CREATE POLICY "Usuarios pueden agregar a su carrito"
  ON carrito FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- El usuario solo puede actualizar su propio carrito
CREATE POLICY "Usuarios pueden actualizar su carrito"
  ON carrito FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

-- El usuario solo puede eliminar de su propio carrito
CREATE POLICY "Usuarios pueden eliminar de su carrito"
  ON carrito FOR DELETE
  USING (auth.uid() = usuario_id);

-- =====================================================
-- VISTA PARA CARRITO CON INFORMACIÓN COMPLETA
-- =====================================================
CREATE OR REPLACE VIEW vista_carrito AS
SELECT 
  c.id,
  c.usuario_id,
  c.platillo_id,
  c.restaurante_id,
  c.cantidad,
  c.precio_unitario,
  c.notas,
  c.creado_en,
  c.actualizado_en,
  p.nombre as platillo_nombre,
  p.descripcion as platillo_descripcion,
  p.imagen_url as platillo_imagen,
  r.nombre as restaurante_nombre,
  r.emoji as restaurante_emoji,
  (c.cantidad * c.precio_unitario) as subtotal
FROM carrito c
LEFT JOIN platillos p ON c.platillo_id = p.id
LEFT JOIN restaurantes r ON c.restaurante_id = r.id;

-- =====================================================
-- FUNCIÓN AUXILIAR: Limpiar carrito del usuario
-- =====================================================
CREATE OR REPLACE FUNCTION limpiar_carrito_usuario(p_usuario_id UUID)
RETURNS void AS $$
BEGIN
  DELETE FROM carrito WHERE usuario_id = p_usuario_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCIÓN AUXILIAR: Obtener total del carrito
-- =====================================================
CREATE OR REPLACE FUNCTION obtener_total_carrito(p_usuario_id UUID)
RETURNS DECIMAL(10,2) AS $$
  SELECT COALESCE(SUM(cantidad * precio_unitario), 0)
  FROM carrito
  WHERE usuario_id = p_usuario_id;
$$ LANGUAGE sql STABLE;
