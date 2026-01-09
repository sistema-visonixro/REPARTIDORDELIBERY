-- SQL para crear tabla de usuarios en Supabase
-- Copia y pega este código en el SQL Editor de Supabase

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  direccion TEXT,
  tipo_usuario VARCHAR(20) DEFAULT 'cliente' CHECK (tipo_usuario IN ('cliente', 'repartidor', 'admin')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- Crear índice para tipo de usuario
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo_usuario);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON usuarios 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar usuario admin de prueba (password: admin123)
-- NOTA: En producción debes usar un hash real, este es solo ejemplo
INSERT INTO usuarios (email, password, nombre, tipo_usuario) 
VALUES ('admin@delibery.com', 'admin123', 'Administrador', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insertar usuario cliente de prueba (password: cliente123)
INSERT INTO usuarios (email, password, nombre, tipo_usuario) 
VALUES ('cliente@test.com', 'cliente123', 'Cliente Test', 'cliente')
ON CONFLICT (email) DO NOTHING;
