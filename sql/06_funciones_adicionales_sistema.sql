-- =====================================================
-- TABLA DE ROLES Y PERMISOS DE USUARIOS
-- =====================================================

-- Tabla para definir el rol del usuario
CREATE TABLE IF NOT EXISTS perfiles_usuario (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Rol del usuario
  rol VARCHAR(50) NOT NULL DEFAULT 'cliente',
  -- Roles: 'cliente', 'repartidor', 'operador', 'admin'
  
  -- Información básica
  nombre_completo VARCHAR(255),
  telefono VARCHAR(20),
  foto_url TEXT,
  
  -- Dirección predeterminada
  direccion_default TEXT,
  latitud_default DECIMAL(10,8),
  longitud_default DECIMAL(11,8),
  
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_perfiles_usuario ON perfiles_usuario(usuario_id);
CREATE INDEX IF NOT EXISTS idx_perfiles_rol ON perfiles_usuario(rol);

-- Constraint para validar roles
ALTER TABLE perfiles_usuario
ADD CONSTRAINT check_rol_usuario 
CHECK (rol IN ('cliente', 'repartidor', 'operador', 'admin'));

-- Trigger para actualizar timestamp
CREATE OR REPLACE FUNCTION actualizar_perfiles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_perfiles_timestamp
  BEFORE UPDATE ON perfiles_usuario
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_perfiles_timestamp();

-- Trigger para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION crear_perfil_usuario()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO perfiles_usuario (usuario_id, rol)
  VALUES (NEW.id, 'cliente');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Nota: Este trigger debe crearse en auth.users (requiere permisos especiales)
-- CREATE TRIGGER trigger_crear_perfil_usuario
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION crear_perfil_usuario();

-- =====================================================
-- POLÍTICAS RLS PARA PERFILES
-- =====================================================
ALTER TABLE perfiles_usuario ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Usuarios pueden ver su perfil"
  ON perfiles_usuario FOR SELECT
  USING (auth.uid() = usuario_id);

-- Los usuarios pueden actualizar su perfil
CREATE POLICY "Usuarios pueden actualizar su perfil"
  ON perfiles_usuario FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

-- Los usuarios pueden crear su perfil
CREATE POLICY "Usuarios pueden crear su perfil"
  ON perfiles_usuario FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- =====================================================
-- TABLA DE NOTIFICACIONES
-- =====================================================
CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL,
  
  -- Contenido
  tipo VARCHAR(50) NOT NULL,
  -- Tipos: 'pedido_confirmado', 'pedido_asignado', 'en_camino', 'entregado', 'cancelado', 'nuevo_pedido'
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  
  -- Referencias
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  
  -- Estado
  leida BOOLEAN DEFAULT false,
  
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX IF NOT EXISTS idx_notificaciones_creado ON notificaciones(creado_en DESC);

-- =====================================================
-- POLÍTICAS RLS PARA NOTIFICACIONES
-- =====================================================
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver sus notificaciones
CREATE POLICY "Usuarios pueden ver sus notificaciones"
  ON notificaciones FOR SELECT
  USING (auth.uid() = usuario_id);

-- Los usuarios pueden actualizar sus notificaciones (marcar como leídas)
CREATE POLICY "Usuarios pueden actualizar sus notificaciones"
  ON notificaciones FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

-- =====================================================
-- FUNCIONES PARA GESTIÓN DE NOTIFICACIONES
-- =====================================================

-- Crear notificación
CREATE OR REPLACE FUNCTION crear_notificacion(
  p_usuario_id UUID,
  p_tipo VARCHAR(50),
  p_titulo VARCHAR(255),
  p_mensaje TEXT,
  p_pedido_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notificacion_id UUID;
BEGIN
  INSERT INTO notificaciones (
    usuario_id,
    tipo,
    titulo,
    mensaje,
    pedido_id
  ) VALUES (
    p_usuario_id,
    p_tipo,
    p_titulo,
    p_mensaje,
    p_pedido_id
  )
  RETURNING id INTO v_notificacion_id;
  
  RETURN v_notificacion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Marcar todas las notificaciones como leídas
CREATE OR REPLACE FUNCTION marcar_notificaciones_leidas(
  p_usuario_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notificaciones
  SET leida = true
  WHERE usuario_id = p_usuario_id
    AND leida = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS PARA NOTIFICACIONES AUTOMÁTICAS
-- =====================================================

-- Notificar cuando cambia el estado del pedido
CREATE OR REPLACE FUNCTION notificar_cambio_estado_pedido()
RETURNS TRIGGER AS $$
DECLARE
  v_titulo VARCHAR(255);
  v_mensaje TEXT;
BEGIN
  -- Solo notificar si cambió el estado
  IF NEW.estado != OLD.estado THEN
    CASE NEW.estado
      WHEN 'confirmado' THEN
        v_titulo := '¡Pedido Confirmado!';
        v_mensaje := 'Tu pedido #' || NEW.numero_pedido || ' ha sido confirmado por el restaurante.';
      WHEN 'en_preparacion' THEN
        v_titulo := '¡En Preparación!';
        v_mensaje := 'Tu pedido #' || NEW.numero_pedido || ' está siendo preparado.';
      WHEN 'listo' THEN
        v_titulo := '¡Pedido Listo!';
        v_mensaje := 'Tu pedido #' || NEW.numero_pedido || ' está listo y esperando un repartidor.';
      WHEN 'en_camino' THEN
        v_titulo := '¡En Camino!';
        v_mensaje := 'Tu pedido #' || NEW.numero_pedido || ' está en camino. ¡Ya puedes ver la ubicación del repartidor!';
      WHEN 'entregado' THEN
        v_titulo := '¡Pedido Entregado!';
        v_mensaje := 'Tu pedido #' || NEW.numero_pedido || ' ha sido entregado. ¡Que lo disfrutes!';
      WHEN 'cancelado' THEN
        v_titulo := 'Pedido Cancelado';
        v_mensaje := 'Tu pedido #' || NEW.numero_pedido || ' ha sido cancelado.';
      ELSE
        RETURN NEW;
    END CASE;
    
    -- Crear notificación para el cliente
    PERFORM crear_notificacion(
      NEW.usuario_id,
      NEW.estado,
      v_titulo,
      v_mensaje,
      NEW.id
    );
    
    -- Si se asignó un repartidor, notificarlo también
    IF NEW.repartidor_id IS NOT NULL AND OLD.repartidor_id IS NULL THEN
      PERFORM crear_notificacion(
        NEW.repartidor_id,
        'nuevo_pedido',
        '¡Nuevo Pedido Asignado!',
        'Se te ha asignado el pedido #' || NEW.numero_pedido,
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notificar_cambio_estado_pedido
  AFTER UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION notificar_cambio_estado_pedido();

-- =====================================================
-- FUNCIONES AUXILIARES ADICIONALES
-- =====================================================

-- Verificar si usuario es repartidor
CREATE OR REPLACE FUNCTION es_repartidor(p_usuario_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM perfiles_usuario
    WHERE usuario_id = p_usuario_id
    AND rol IN ('repartidor', 'admin')
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Obtener estadísticas del cliente
CREATE OR REPLACE FUNCTION obtener_estadisticas_cliente(p_usuario_id UUID)
RETURNS TABLE (
  total_pedidos INTEGER,
  pedidos_completados INTEGER,
  pedidos_en_curso INTEGER,
  total_gastado DECIMAL(10,2),
  restaurante_favorito VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_pedidos,
    COUNT(*) FILTER (WHERE estado = 'entregado')::INTEGER as pedidos_completados,
    COUNT(*) FILTER (WHERE estado IN ('pendiente', 'confirmado', 'en_preparacion', 'listo', 'en_camino'))::INTEGER as pedidos_en_curso,
    COALESCE(SUM(total) FILTER (WHERE estado = 'entregado'), 0) as total_gastado,
    (
      SELECT r.nombre
      FROM pedidos p2
      JOIN restaurantes r ON p2.restaurante_id = r.id
      WHERE p2.usuario_id = p_usuario_id
      GROUP BY r.id, r.nombre
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ) as restaurante_favorito
  FROM pedidos
  WHERE usuario_id = p_usuario_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Limpiar pedidos antiguos entregados (opcional - ejecutar periódicamente)
CREATE OR REPLACE FUNCTION limpiar_pedidos_antiguos(p_dias INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM pedidos
  WHERE estado = 'entregado'
    AND entregado_en < NOW() - (p_dias || ' days')::INTERVAL;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Obtener pedidos activos del usuario
CREATE OR REPLACE FUNCTION obtener_pedidos_activos(p_usuario_id UUID)
RETURNS TABLE (
  pedido_id UUID,
  numero_pedido VARCHAR(50),
  total DECIMAL(10,2),
  estado VARCHAR(50),
  restaurante_nombre VARCHAR(255),
  tiene_repartidor BOOLEAN,
  tracking_activo BOOLEAN,
  creado_en TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.numero_pedido,
    p.total,
    p.estado,
    r.nombre,
    (p.repartidor_id IS NOT NULL),
    (p.estado = 'en_camino'),
    p.creado_en
  FROM pedidos p
  JOIN restaurantes r ON p.restaurante_id = r.id
  WHERE p.usuario_id = p_usuario_id
    AND p.estado != 'entregado'
    AND p.estado != 'cancelado'
  ORDER BY p.creado_en DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Validar que el carrito sea del mismo restaurante
CREATE OR REPLACE FUNCTION validar_carrito_restaurante()
RETURNS TRIGGER AS $$
DECLARE
  v_restaurante_existente UUID;
BEGIN
  SELECT DISTINCT restaurante_id INTO v_restaurante_existente
  FROM carrito
  WHERE usuario_id = NEW.usuario_id
  LIMIT 1;
  
  IF v_restaurante_existente IS NOT NULL AND v_restaurante_existente != NEW.restaurante_id THEN
    RAISE EXCEPTION 'Solo puedes agregar items de un restaurante a la vez. Vacía el carrito primero.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_carrito_restaurante
  BEFORE INSERT ON carrito
  FOR EACH ROW
  EXECUTE FUNCTION validar_carrito_restaurante();
