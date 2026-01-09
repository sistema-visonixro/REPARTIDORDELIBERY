# 📊 Paneles de Usuario - Sistema Delibery

## 🎯 Descripción

Sistema completo de paneles tipo dashboard para cada tipo de usuario en Delibery, con actualización en tiempo real y diseño moderno.

## 📁 Archivos Creados

### Backend (SQL)
- `sql/07_vistas_paneles_usuarios.sql` - Vistas SQL para cada tipo de panel

### Frontend (React/TypeScript)

#### Tipos y Servicios
- `src/types/panel.types.ts` - Interfaces TypeScript para todos los paneles
- `src/services/panel.service.ts` - Servicios para consumir las vistas y suscripciones en tiempo real

#### Componentes de Paneles
- `src/pages/repartidor/DashboardRepartidor.tsx` - Panel para repartidores
- `src/pages/DashboardRestaurante.tsx` - Panel para restaurantes
- `src/pages/DashboardOperador.tsx` - Panel para operadores
- `src/pages/DashboardAdmin.tsx` - Panel para administradores

#### Actualización
- `src/lib/supabase.ts` - Actualizado con nuevos tipos de usuario

## 🚀 Instalación

### 1. Base de Datos (Supabase)

Primero ejecuta en Supabase SQL Editor:

```sql
-- Actualizar tipos de usuario
ALTER TABLE usuarios
DROP CONSTRAINT usuarios_tipo_usuario_check;

ALTER TABLE usuarios
ADD CONSTRAINT usuarios_tipo_usuario_check
CHECK (
  tipo_usuario::text = ANY (
    ARRAY[
      'cliente',
      'repartidor',
      'restaurante',
      'operador',
      'admin'
    ]::text[]
  )
);
```

Luego ejecuta todo el contenido de:
```sql
sql/07_vistas_paneles_usuarios.sql
```

### 2. Frontend

Asegúrate de tener instalado `react-icons`:

```bash
npm install react-icons
```

### 3. Rutas (Opcional)

Agrega las rutas en tu archivo de rutas principal (ej: `App.tsx` o `main.tsx`):

```tsx
import DashboardRepartidor from "./pages/repartidor/DashboardRepartidor";
import DashboardRestaurante from "./pages/DashboardRestaurante";
import DashboardOperador from "./pages/DashboardOperador";
import DashboardAdmin from "./pages/DashboardAdmin";

// En tus rutas:
{
  path: "/repartidor/dashboard",
  element: <DashboardRepartidor />
},
{
  path: "/restaurante/dashboard",
  element: <DashboardRestaurante />
},
{
  path: "/operador/dashboard",
  element: <DashboardOperador />
},
{
  path: "/admin/dashboard",
  element: <DashboardAdmin />
}
```

## 📊 Características por Panel

### 🚚 Panel Repartidor
- ✅ Estadísticas personales (entregas y ganancias del día/mes)
- ✅ Estado actual y disponibilidad
- ✅ Pedido activo en tiempo real
- ✅ Total de entregas históricas
- ✅ Calificación promedio
- ✅ Actualización en tiempo real

**Métricas:**
- Entregas hoy
- Ganancias hoy (15% comisión)
- Entregas del mes
- Ganancias del mes
- Pedido activo con detalles completos

### 🍽️ Panel Restaurante
- ✅ Pedidos del día (pendientes, en proceso, completados)
- ✅ Ingresos del día y del mes
- ✅ Inventario (platillos y bebidas)
- ✅ Pedidos pendientes de confirmación
- ✅ Platillo más vendido del mes
- ✅ Alertas de pedidos pendientes

**Métricas:**
- Pedidos hoy
- Pedidos en proceso
- Pedidos completados
- Ingresos hoy y del mes
- Total de productos disponibles

### 🎯 Panel Operador
- ✅ Vista general del sistema en tiempo real
- ✅ Estados de todos los pedidos activos
- ✅ Recursos disponibles (repartidores y restaurantes)
- ✅ Alertas de pedidos retrasados
- ✅ Pedidos sin repartidor asignado
- ✅ Lista de pedidos urgentes (>20 min)

**Métricas:**
- Pedidos por estado (pendiente, confirmado, en preparación, etc.)
- Repartidores disponibles vs en entrega
- Restaurantes activos
- Tiempo promedio de entrega
- Alertas críticas

### 👑 Panel Admin
- ✅ Métricas completas del sistema
- ✅ KPIs principales (usuarios, pedidos, ingresos)
- ✅ Distribución de pedidos por estado
- ✅ Top 5 restaurantes del mes
- ✅ Top 5 repartidores del mes
- ✅ Estadísticas de recursos
- ✅ Tiempos de entrega globales

**Métricas:**
- Total de usuarios, pedidos e ingresos
- Tasa de completación
- Ticket promedio
- Nuevos usuarios del día/mes
- Comparativas mensuales
- Rankings de rendimiento

## 🔄 Actualización en Tiempo Real

Todos los paneles incluyen suscripciones en tiempo real mediante Supabase Realtime:

- **Repartidor**: Se actualiza cuando cambian sus pedidos o datos personales
- **Restaurante**: Se actualiza cuando hay nuevos pedidos para el restaurante
- **Operador**: Se actualiza cuando cambia cualquier pedido o repartidor
- **Admin**: Se actualiza cuando hay cambios en pedidos

## 🎨 Diseño

- Diseño moderno con gradientes y colores específicos por rol
- Totalmente responsive (móvil, tablet, desktop)
- Iconos de React Icons
- Tailwind CSS para estilos
- Animaciones sutiles

## 🔐 Seguridad

- Validación de tipo de usuario antes de mostrar cada panel
- Redirección automática si el usuario no tiene permisos
- RLS (Row Level Security) en las vistas SQL

## 📱 Acceso según Tipo de Usuario

| Tipo Usuario | Panel Accesible | Ruta |
|--------------|----------------|------|
| Repartidor | Dashboard Repartidor | `/repartidor/dashboard` |
| Restaurante | Dashboard Restaurante | `/restaurante/dashboard` |
| Operador | Dashboard Operador | `/operador/dashboard` |
| Admin | Dashboard Admin | `/admin/dashboard` |
| Cliente | HomeClient (existente) | `/` |

## 🧪 Pruebas

Para probar cada panel, necesitas:

1. Usuarios en la base de datos con cada tipo
2. Datos de prueba (pedidos, repartidores, restaurantes)
3. Ejecutar el SQL de vistas

### Crear Usuario de Prueba

```sql
-- Usuario Repartidor
INSERT INTO usuarios (email, password, nombre, tipo_usuario)
VALUES ('repartidor@test.com', 'password123', 'Juan Repartidor', 'repartidor');

-- Usuario Restaurante
INSERT INTO usuarios (email, password, nombre, tipo_usuario)
VALUES ('restaurante@test.com', 'password123', 'Pizza Palace', 'restaurante');

-- Usuario Operador
INSERT INTO usuarios (email, password, nombre, tipo_usuario)
VALUES ('operador@test.com', 'password123', 'Carlos Operador', 'operador');

-- Usuario Admin
INSERT INTO usuarios (email, password, nombre, tipo_usuario)
VALUES ('admin@test.com', 'password123', 'Admin Sistema', 'admin');
```

## 📝 Notas Importantes

1. **Restaurantes**: Por ahora asume que el `usuario_id` es el mismo que `restaurante_id`. En producción, deberías crear una tabla de relación.

2. **Permisos RLS**: Asegúrate de configurar las políticas RLS en Supabase para que cada usuario solo vea sus datos.

3. **Actualización Periódica**: Los paneles de Operador y Admin se actualizan cada 30-60 segundos automáticamente.

4. **Rendimiento**: Las vistas SQL están optimizadas con índices, pero con muchos datos considera paginación.

## 🔧 Personalización

### Cambiar Colores

Edita los gradientes en cada archivo `.tsx`:

```tsx
// Repartidor: azul/indigo
from-blue-50 to-indigo-100

// Restaurante: naranja/rojo
from-orange-50 to-red-100

// Operador: púrpura/indigo
from-purple-50 to-indigo-100

// Admin: oscuro/púrpura
from-gray-900 via-purple-900 to-indigo-900
```

### Agregar Métricas

1. Modifica la vista SQL correspondiente en `sql/07_vistas_paneles_usuarios.sql`
2. Actualiza la interfaz TypeScript en `src/types/panel.types.ts`
3. Agrega la visualización en el componente `.tsx`

## 🐛 Troubleshooting

### "No se pudo cargar la información del panel"

- Verifica que las vistas SQL estén creadas en Supabase
- Confirma que el usuario tenga el tipo correcto
- Revisa la consola para errores de conexión

### Panel en blanco o no carga

- Verifica que las rutas estén configuradas
- Confirma que `react-icons` esté instalado
- Revisa los permisos RLS en Supabase

### Datos no se actualizan en tiempo real

- Verifica que Realtime esté habilitado en Supabase
- Confirma que las suscripciones estén activas
- Revisa la consola para errores de WebSocket

## 📞 Soporte

Si encuentras problemas:
1. Revisa la consola del navegador (F12)
2. Verifica los logs de Supabase
3. Confirma que todas las dependencias estén instaladas

## ✨ Próximas Mejoras

- [ ] Gráficos interactivos con Chart.js o Recharts
- [ ] Exportación de reportes en PDF
- [ ] Filtros por rango de fechas
- [ ] Notificaciones push
- [ ] Modo oscuro
- [ ] Comparativas por periodo

---

**Desarrollado para Delibery** 🚀
