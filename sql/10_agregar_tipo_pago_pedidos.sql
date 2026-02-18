-- =====================================================
-- AGREGAR CAMPO TIPO_PAGO A TABLA PEDIDOS
-- =====================================================

-- Agregar columna tipo_pago
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS tipo_pago VARCHAR(50) DEFAULT 'efectivo';

-- Agregar constraint para validar tipos de pago
ALTER TABLE pedidos
ADD CONSTRAINT check_tipo_pago 
CHECK (tipo_pago IN ('efectivo', 'tarjeta', 'transferencia'));

-- Actualizar registros existentes para que tengan un valor por defecto
UPDATE pedidos
SET tipo_pago = 'efectivo'
WHERE tipo_pago IS NULL;

-- Comentario de la columna
COMMENT ON COLUMN pedidos.tipo_pago IS 'Método de pago: efectivo, tarjeta o transferencia';
