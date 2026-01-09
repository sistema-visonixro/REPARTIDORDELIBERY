# 📦 Sistema de Delivery - Documentación SQL

## 🎯 Descripción General

Sistema completo de delivery con las siguientes funcionalidades:

- **Clientes**: Ver restaurantes, platillos, agregar al carrito, realizar pedidos y hacer seguimiento
- **Repartidores**: Tomar pedidos, actualizar ubicación GPS en tiempo real, marcar entregas
- **Tracking en tiempo real**: Ubicación del repartidor actualizada cada minuto
- **Notificaciones**: Sistema automático de notificaciones según estado del pedido

## 📋 Estructura de Archivos SQL

### Orden de Ejecución

1. **01_actualizar_platillos_categoria.sql**

   - Agrega columna `categoria_tipo` a tabla `platillos`
   - Valores: 'comida', 'bebida', 'postre', 'mandadito'
   - Actualiza datos existentes según categorías

2. **02_crear_tabla_carrito.sql**

   - Tabla `carrito` para items temporales
   - Vista `vista_carrito` con información completa
   - Funciones para limpiar y obtener total del carrito
   - Políticas RLS para seguridad

3. **03_crear_tabla_pedidos.sql**

   - Tabla `pedidos` con todos los estados del pedido
   - Tabla `detalle_pedidos` con items del pedido
   - Estados: pendiente → confirmado → en_preparacion → listo → en_camino → entregado
   - Función `crear_pedido_desde_carrito()` para crear pedido automáticamente
   - Vista `vista_pedidos_completa`

4. **04_crear_tabla_repartidores.sql**

   - Tabla `repartidores` con información del repartidor
   - Tabla `ubicaciones_repartidor` para tracking GPS
   - Función `actualizar_ubicacion_repartidor()` para guardar ubicación
   - Función `obtener_repartidores_cercanos()` usando fórmula de Haversine
   - Vistas para repartidores disponibles

5. **05_crear_vistas_sistema.sql**

   - `vista_pedidos_cliente`: Pedidos del cliente con info del repartidor
   - `vista_detalle_pedido_completo`: Detalle de items del pedido
   - `vista_pedidos_disponibles_repartidores`: Pedidos sin asignar
   - `vista_pedidos_repartidor`: Pedidos activos del repartidor
   - `vista_tracking_pedido`: Historial de ubicaciones
   - `vista_ubicacion_actual_pedido`: Última ubicación en tiempo real
   - `vista_estadisticas_repartidor`: Stats del repartidor
   - `vista_resumen_carrito`: Resumen del carrito por usuario

6. **06_funciones_adicionales_sistema.sql**
   - Tabla `perfiles_usuario` para roles (cliente, repartidor, operador, admin)
   - Tabla `notificaciones` para notificaciones push
   - Triggers automáticos para notificaciones según cambios de estado
   - Funciones de estadísticas y validaciones

## 🚀 Instalación

### Opción 1: Ejecutar todo de una vez (Recomendado)

```bash
# En Supabase SQL Editor, ejecuta:
\i sql/00_ejecutar_todo.sql
```

### Opción 2: Ejecutar archivo por archivo

En Supabase SQL Editor, ejecuta cada archivo en orden:

```sql
-- 1. Categorías en platillos
\i sql/01_actualizar_platillos_categoria.sql

-- 2. Carrito
\i sql/02_crear_tabla_carrito.sql

-- 3. Pedidos
\i sql/03_crear_tabla_pedidos.sql

-- 4. Repartidores
\i sql/04_crear_tabla_repartidores.sql

-- 5. Vistas
\i sql/05_crear_vistas_sistema.sql

-- 6. Funciones adicionales
\i sql/06_funciones_adicionales_sistema.sql
```

## 📊 Tablas Principales

### `platillos`

```sql
categoria_tipo VARCHAR(50) -- 'comida', 'bebida', 'postre', 'mandadito'
```

### `carrito`

```sql
id, usuario_id, platillo_id, restaurante_id, cantidad, precio_unitario, notas
```

### `pedidos`

```sql
id, usuario_id, restaurante_id, repartidor_id, numero_pedido, total, estado,
direccion_entrega, latitud, longitud, notas_cliente, notas_repartidor
```

### `detalle_pedidos`

```sql
id, pedido_id, platillo_id, cantidad, precio_unitario, subtotal, notas
```

### `repartidores`

```sql
id, usuario_id, nombre_completo, telefono, tipo_vehiculo, estado, disponible,
latitud_actual, longitud_actual, total_entregas, calificacion_promedio
```

### `ubicaciones_repartidor`

```sql
id, repartidor_id, pedido_id, latitud, longitud, velocidad, precision_metros
```

### `perfiles_usuario`

```sql
id, usuario_id, rol, nombre_completo, telefono, direccion_default
```

### `notificaciones`

```sql
id, usuario_id, tipo, titulo, mensaje, pedido_id, leida
```

## 🔄 Flujo del Sistema

### 1. Cliente realiza pedido

```typescript
// 1. Cliente agrega items al carrito
await supabase.from("carrito").insert({
  usuario_id: user.id,
  platillo_id: platillo.id,
  restaurante_id: restaurante.id,
  cantidad: 1,
  precio_unitario: platillo.precio,
});

// 2. Cliente crea pedido desde carrito
const { data } = await supabase.rpc("crear_pedido_desde_carrito", {
  p_usuario_id: user.id,
  p_direccion_entrega: "Calle 123",
  p_latitud: 19.4326,
  p_longitud: -99.1332,
  p_notas_cliente: "Sin cebolla",
});
```

### 2. Repartidor toma pedido

```typescript
// Ver pedidos disponibles
const { data: pedidos } = await supabase
  .from("vista_pedidos_disponibles_repartidores")
  .select("*");

// Asignar pedido a repartidor
await supabase.rpc("asignar_repartidor_pedido", {
  p_pedido_id: pedido.id,
  p_repartidor_id: repartidor.usuario_id,
});
```

### 3. Tracking en tiempo real

```typescript
// Actualizar ubicación del repartidor (cada 60 segundos)
setInterval(async () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      await supabase.rpc("actualizar_ubicacion_repartidor", {
        p_repartidor_id: repartidor.id,
        p_latitud: position.coords.latitude,
        p_longitud: position.coords.longitude,
        p_pedido_id: pedidoActual.id,
        p_velocidad: position.coords.speed,
        p_precision: position.coords.accuracy,
      });
    });
  }
}, 60000); // Cada 60 segundos

// Cliente ve ubicación en tiempo real
const { data: tracking } = await supabase
  .from("vista_ubicacion_actual_pedido")
  .select("*")
  .eq("pedido_id", pedido.id)
  .single();
```

### 4. Marcar como entregado

```typescript
await supabase.rpc("marcar_pedido_entregado", {
  p_pedido_id: pedido.id,
  p_repartidor_id: repartidor.usuario_id,
});
```

## 🗺️ Mapas Gratuitos para Tracking

Puedes usar alguna de estas opciones gratuitas:

### OpenStreetMap con Leaflet

```bash
npm install leaflet react-leaflet
```

```typescript
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

<MapContainer center={[lat, lng]} zoom={13}>
  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
  <Marker position={[clienteLat, clienteLng]}>
    <Popup>Cliente</Popup>
  </Marker>
  <Marker position={[repartidorLat, repartidorLng]}>
    <Popup>Repartidor</Popup>
  </Marker>
</MapContainer>;
```

### Mapbox (Plan gratuito: 50,000 solicitudes/mes)

```bash
npm install mapbox-gl
```

## 📱 Vistas Necesarias en el Frontend

### Cliente

1. **HomeClient** - Ver restaurantes y platillos
2. **Categorias** - Filtrar por comida/bebida/postre
3. **DetallePlatillo** - Ver platillo y agregar al carrito
4. **Carrito** - Ver carrito y realizar pedido
5. **Pedidos** - Ver pedidos activos
6. **DetallePedido** - Ver estado del pedido y tracking

### Repartidor

1. **PedidosDisponibles** - Ver pedidos sin asignar
2. **MisPedidos** - Ver pedidos asignados
3. **EntregaActiva** - Tracking y navegación
4. **Perfil** - Stats y configuración

## 🔐 Seguridad RLS

Todas las tablas tienen políticas RLS activas:

- Los usuarios solo ven sus propios datos
- Los repartidores ven pedidos asignados a ellos
- Las ubicaciones solo se comparten durante entregas activas

## 📊 Consultas Útiles

### Ver pedidos activos del cliente

```sql
SELECT * FROM vista_pedidos_cliente
WHERE usuario_id = 'user-uuid'
ORDER BY creado_en DESC;
```

### Ver ubicación actual del pedido

```sql
SELECT * FROM vista_ubicacion_actual_pedido
WHERE pedido_id = 'pedido-uuid';
```

### Ver pedidos disponibles para repartidores

```sql
SELECT * FROM vista_pedidos_disponibles_repartidores
ORDER BY creado_en ASC;
```

### Estadísticas del repartidor

```sql
SELECT * FROM vista_estadisticas_repartidor
WHERE usuario_id = 'repartidor-uuid';
```

## 🎨 Estados del Pedido

1. **pendiente** - Pedido creado, esperando confirmación
2. **confirmado** - Restaurante confirmó el pedido
3. **en_preparacion** - Preparando la comida
4. **listo** - Pedido listo, esperando repartidor
5. **en_camino** - Repartidor en camino (tracking activo)
6. **entregado** - Pedido entregado (desaparece de vista)
7. **cancelado** - Pedido cancelado

## 🔔 Notificaciones Automáticas

El sistema crea notificaciones automáticamente cuando:

- Pedido es confirmado
- Pedido está en preparación
- Pedido está listo
- Repartidor asignado (tracking disponible)
- Pedido en camino
- Pedido entregado
- Pedido cancelado

## 📞 Soporte

Para más información o problemas:

1. Verifica que todas las tablas se crearon correctamente
2. Verifica las políticas RLS en Supabase Dashboard
3. Asegúrate de que el usuario autenticado tiene los permisos correctos

## ✅ Checklist de Implementación

- [ ] Ejecutar todos los scripts SQL
- [ ] Verificar tablas creadas
- [ ] Verificar vistas creadas
- [ ] Verificar funciones creadas
- [ ] Probar crear usuario y perfil
- [ ] Probar agregar items al carrito
- [ ] Probar crear pedido
- [ ] Probar asignar repartidor
- [ ] Probar actualizar ubicación
- [ ] Probar marcar como entregado
- [ ] Implementar mapa en frontend
- [ ] Implementar sistema de notificaciones

---

## 🚀 ¡Todo listo para empezar a desarrollar!
