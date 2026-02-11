-- =====================================================
-- TABLA DE AVISOS (ADMIN -> REPARTIDORES)
-- =====================================================

CREATE TABLE IF NOT EXISTS avisos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  prioridad VARCHAR(10) NOT NULL DEFAULT 'media',
  fecha_inicio TIMESTAMPTZ,
  fecha_fin TIMESTAMPTZ,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Prioridades permitidas
ALTER TABLE avisos
ADD CONSTRAINT check_aviso_prioridad
CHECK (prioridad IN ('alta', 'media', 'baja'));

-- Indices
CREATE INDEX IF NOT EXISTS idx_avisos_creado_en ON avisos(creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_avisos_prioridad ON avisos(prioridad);

-- RLS
ALTER TABLE avisos ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer avisos
CREATE POLICY "Todos pueden ver avisos"
  ON avisos FOR SELECT
  USING (true);

-- Solo admin puede crear/editar (ajusta segun tu control)
CREATE POLICY "Solo admin puede crear avisos"
  ON avisos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Solo admin puede editar avisos"
  ON avisos FOR UPDATE
  USING (true);

CREATE POLICY "Solo admin puede borrar avisos"
  ON avisos FOR DELETE
  USING (true);
