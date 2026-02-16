# 🗺️ Mapa 3D Profesional con Google Maps

## ✨ Características Implementadas

### 🌍 Vista 3D Inmersiva

- **Inclinación (Tilt)**: Vista con perspectiva de 45° que simula una vista aérea oblicua
- **Rotación (Heading)**: Control completo de rotación en 360°
- **Animación inicial**: Rotación automática de 360° al cargar el mapa para mostrar el entorno
- **Vistas múltiples**: Roadmap, Satellite, Hybrid y Terrain

### 🎯 Marcadores 3D Avanzados

- **Advanced Marker Element**: Última tecnología de Google Maps para marcadores
- **Marcadores personalizados**:
  - 🍽️ **Restaurante**: Pin rojo con efecto 3D
  - 🏠 **Cliente**: Pin verde con efecto 3D
  - 🚚 **Repartidor**: Pin morado con animación en tiempo real
- **Info Windows**: Ventanas de información con diseño moderno y animaciones

### 🛣️ Sistema de Rutas Inteligente

- **Directions API**: Calcula la ruta óptima en tiempo real
- **Ruta visual**: Línea morada (#667eea) con grosor de 6px
- **Selector de Rutas**:
  - 🏠 **Ruta al Cliente**: Desde repartidor hasta punto de entrega
  - 🍽️ **Ruta al Restaurante**: Desde repartidor hasta punto de recogida
  - Cambio instantáneo entre rutas con un click
- **Datos en vivo**:
  - 📍 Distancia exacta en kilómetros
  - ⏱️ Tiempo estimado de llegada en minutos
  - 🎯 Destino actual seleccionado
- **Actualización automática**: Recalcula la ruta cuando el repartidor se mueve o cambia el destino

### 🎮 Controles Interactivos (Fuera del Mapa)

Los controles ahora están organizados profesionalmente **fuera del mapa** en la parte inferior:

#### Panel de Selección de Ruta

- **Botones grandes e interactivos** con iconos y descripciones
- **Indicador visual** del destino activo (gradiente morado)
- **Animaciones suaves** al cambiar de ruta
- **Estado disabled** cuando no hay datos disponibles

#### Controles 3D

- **↶ Rotar Izq**: Gira el mapa 45° a la izquierda
- **↷ Rotar Der**: Gira el mapa 45° a la derecha
- **⬆ Inclinar +**: Aumenta el ángulo de vista 3D
- **⬇ Inclinar -**: Disminuye el ángulo de vista 3D

#### Acciones Rápidas

- **🎯 Centrar**: Centra y hace zoom en la posición del repartidor
- **🛰️ Vista**: Alterna entre vista de mapa y satélite
- **👁️ Street View**: Activa/desactiva Street View en la ubicación del repartidor

### 📊 Panel de Información Glassmorphism

- **Diseño moderno**: Fondo difuminado con efecto glassmorphism
- **Indicador de estado**: Punto verde pulsante que muestra actividad en vivo
- **Información en tiempo real**:
  - Distancia actual
  - Tiempo estimado de llegada
- **Animación de entrada**: Desliza desde la izquierda con efecto suave

### 🔄 Tracking en Tiempo Real

- **Supabase Realtime**: Suscripción a cambios en la tabla `ubicacion_real`
- **Actualización automática**: Sin necesidad de recargar la página
- **Animación fluida**: Transiciones suaves del marcador del repartidor
- **Sin parpadeos**: Experiencia visual continua

### 🎨 Efectos Visuales Premium

#### Diseño de Controles Profesional

- **Controles externos**: Totalmente fuera del mapa, no obstruyen la vista
- **Layout Grid**: Sistema de rejilla adaptativo para los botones
- **Glassmorphism Cards**: Tarjetas con efecto de vidrio para cada sección
- **Hover Effects**: Efectos de brillo y elevación al pasar el cursor
- **Active States**: Indicadores visuales claros del estado activo
- **Animaciones de onda**: Efecto ripple al hacer click en los botones

#### Animaciones CSS

- **Pulso**: Efecto de latido en el indicador de estado
- **Float**: Iconos flotantes en info windows
- **Spin**: Icono de carga giratorio
- **Glow**: Efecto de brillo en bordes al hacer hover
- **SlideIn**: Entrada suave de paneles
- **Rotate360**: Rotación continua del badge 3D
- **Bounce**: Efecto de rebote en iconos al seleccionar ruta
- **Ripple**: Onda expansiva en botones al hacer click

#### Glassmorphism

- **Backdrop-filter**: Desenfoque de 20px
- **Semi-transparencia**: rgba(255, 255, 255, 0.95)
- **Bordes suaves**: border-radius de 16px
- **Sombras multicapa**: box-shadow con múltiples capas

### 🌓 Modo Oscuro

- **Detección automática**: prefers-color-scheme: dark
- **Paleta adaptativa**: Colores que se ajustan al tema del sistema
- **Contraste mejorado**: Mejor legibilidad en ambientes oscuros

### 📱 Diseño Responsivo

- **Desktop**: 700px de altura, controles grandes
- **Tablet**: 500px de altura, controles medianos
- **Mobile**: 400px de altura, controles compactos
- **Adaptación automática**: Se ajusta al tamaño de la pantalla

## 🔑 API Key de Google Maps

```
AIzaSyD9ZMr4EAvpCy-AW5dg2IsSJeC9bPTUFOQ
```

### Librerías activadas:

- `maps` - Mapa base con 3D
- `places` - Lugares y geocodificación
- `geometry` - Cálculos geométricos
- `marker` - Advanced Marker Element (beta)

## 🚀 Tecnologías Utilizadas

### Google Maps JavaScript API

- **Map**: Vista 3D con tilt y heading
- **AdvancedMarkerElement**: Marcadores modernos con 3D
- **PinElement**: Pins personalizables con colores
- **DirectionsService**: Cálculo de rutas
- **DirectionsRenderer**: Renderizado de rutas
- **InfoWindow**: Ventanas de información
- **StreetViewPanorama**: Vista de calle integrada

### React & TypeScript

- **useEffect**: Gestión de ciclo de vida
- **useState**: Estado reactivo
- **useRef**: Referencias a elementos del DOM y objetos de Google Maps
- **TypeScript**: Tipado fuerte para seguridad

### Supabase Realtime

- **WebSocket**: Conexión en tiempo real
- **Channel**: Suscripción a cambios de ubicación
- **postgres_changes**: Eventos de actualización

### CSS Moderno

- **Backdrop-filter**: Efectos de desenfoque
- **Gradients**: Colores degradados
- **Keyframes**: Animaciones personalizadas
- **Flexbox**: Layout flexible
- **Media queries**: Diseño responsivo

## 📖 Uso del Componente

```tsx
import MapaGoogle3DPro from "../../components/MapaGoogle3DPro";

<MapaGoogle3DPro
  clienteLat={40.7128}
  clienteLng={-74.006}
  restauranteLat={40.758}
  restauranteLng={-73.9855}
  repartidorId="user-uuid-123"
/>;
```

### Props

| Prop             | Tipo             | Requerido | Descripción                     |
| ---------------- | ---------------- | --------- | ------------------------------- |
| `clienteLat`     | `number`         | ✅        | Latitud del cliente             |
| `clienteLng`     | `number`         | ✅        | Longitud del cliente            |
| `restauranteLat` | `number \| null` | ❌        | Latitud del restaurante         |
| `restauranteLng` | `number \| null` | ❌        | Longitud del restaurante        |
| `repartidorId`   | `string \| null` | ❌        | ID del repartidor para tracking |

## 🎯 Funcionalidades Interactivas

### Selector de Rutas

El mapa ahora permite **cambiar entre dos rutas** diferentes:

1. **Ruta al Cliente (Por defecto)**:
   - Muestra la ruta desde la ubicación actual del repartidor hasta el punto de entrega del cliente
   - Botón con icono 🏠 y gradiente morado cuando está activo
   - Calcula distancia y tiempo automáticamente

2. **Ruta al Restaurante**:
   - Muestra la ruta desde la ubicación actual del repartidor hasta el restaurante
   - Botón con icono 🍽️ y gradiente morado cuando está activo
   - Útil para cuando el repartidor debe ir a recoger el pedido

**Cómo usar:**

- Click en cualquiera de los dos botones grandes en la sección "Seleccionar Ruta"
- El mapa recalcula la ruta automáticamente
- El panel de información se actualiza con la nueva distancia y tiempo
- La ruta visual en el mapa cambia instantáneamente

### Controles de Usuario

1. **Rotar Mapa**: Click en ↶ o ↷ para girar 45°
2. **Inclinar Vista**: Click en ⬆ o ⬇ para ajustar perspectiva
3. **Centrar en Repartidor**: Click en 🎯 para seguir al repartidor
4. **Cambiar Vista**: Click en 🛰️ para alternar mapas
5. **Street View**: Click en 👁️ para vista de calle
6. **Info Windows**: Click en marcadores para ver detalles
7. **Zoom**: Rueda del ratón o gestos táctiles
8. **Pan**: Arrastrar el mapa
9. **Pantalla completa**: Botón de fullscreen nativo

### Interacciones del Mapa

- **Gestos táctiles**: Soporte completo en móviles
- **Teclado**: Flechas para navegar
- **Zoom con doble click**: Zoom rápido
- **Rotación con dos dedos**: En dispositivos táctiles
- **Inclinación con dos dedos**: Gesto de arrastre vertical

## 🔧 Personalización

### Cambiar Colores de Marcadores

En [MapaGoogle3DPro.tsx](src/components/MapaGoogle3DPro.tsx):

```tsx
// Restaurante (línea ~175)
const restaurantePinBackground = new PinElement({
  background: "#FF6B6B", // Color de fondo
  borderColor: "#C92A2A", // Color de borde
  glyphColor: "#FFF", // Color del icono
  scale: 1.5, // Tamaño
});

// Cliente (línea ~197)
const clientePinBackground = new PinElement({
  background: "#51CF66",
  borderColor: "#2F9E44",
  glyphColor: "#FFF",
  scale: 1.5,
});

// Repartidor (línea ~267)
const repartidorPinBackground = new PinElement({
  background: "#667eea",
  borderColor: "#5568D3",
  glyphColor: "#FFF",
  scale: 1.8,
});
```

### Cambiar Color de Ruta

En [MapaGoogle3DPro.tsx](src/components/MapaGoogle3DPro.tsx) línea ~160:

```tsx
polylineOptions: {
  strokeColor: "#667eea", // Color de la línea
  strokeWeight: 6, // Grosor
  strokeOpacity: 0.9, // Opacidad
}
```

### Ajustar Vista Inicial

En [MapaGoogle3DPro.tsx](src/components/MapaGoogle3DPro.tsx) línea ~130:

```tsx
const map = new Map(mapRef.current, {
  zoom: 15, // Nivel de zoom (1-22)
  tilt: 45, // Inclinación (0-67.5)
  heading: 0, // Rotación (0-360)
  mapTypeId: "satellite", // "roadmap" | "satellite" | "hybrid" | "terrain"
});
```

### Modificar Estilos

En [MapaGoogle3DPro.css](src/components/MapaGoogle3DPro.css):

```css
/* Altura del mapa */
.mapa-google-3d-container {
  height: 700px; /* Cambiar altura */
  border-radius: 20px; /* Radio de bordes */
}

/* Colores del panel */
.info-panel-3d {
  background: rgba(255, 255, 255, 0.95); /* Fondo */
  backdrop-filter: blur(20px); /* Desenfoque */
}

/* Botones de control */
.control-btn {
  width: 48px; /* Ancho */
  height: 48px; /* Alto */
  background: rgba(255, 255, 255, 0.95); /* Fondo */
}
```

## 🐛 Troubleshooting

### El mapa no se carga

1. Verificar que la API key esté en [index.html](index.html)
2. Verificar que las librerías estén incluidas: `places,geometry,marker`
3. Abrir la consola del navegador para ver errores

### Los marcadores no aparecen

1. Verificar que las coordenadas sean válidas
2. Verificar que `window.google.maps` esté cargado
3. Esperar a que el mapa termine de cargar

### La ruta no se muestra

1. Verificar que `repartidorId` sea válido
2. Verificar que exista una entrada en `ubicacion_real`
3. Verificar que las coordenadas del repartidor sean válidas

### Street View no funciona

1. Verificar que haya cobertura de Street View en la ubicación
2. Verificar que `repartidorPos` no sea null
3. Algunos lugares no tienen Street View disponible

## 🎉 Características Destacadas

✅ **Vista 3D Real** con Google Maps  
✅ **Tracking en Tiempo Real** con Supabase  
✅ **Rutas Inteligentes** con Directions API  
✅ **Selector de Rutas Dual** (Cliente/Restaurante)  
✅ **Controles Externos** profesionales sin obstruir el mapa  
✅ **Design System Moderno** con cards y gradientes  
✅ **Animaciones Fluidas** CSS avanzadas  
✅ **Efectos Ripple y Bounce** en interacciones  
✅ **Street View Integrado**  
✅ **Responsive Design** completo  
✅ **Modo Oscuro** automático  
✅ **Info Windows** personalizadas  
✅ **Actualización en Tiempo Real** de rutas  
✅ **Layout Grid Adaptativo** para botones

## 📈 Próximas Mejoras Posibles

🔮 **Traffic Layer**: Mostrar tráfico en tiempo real  
🔮 **Waypoints**: Múltiples paradas en la ruta  
🔮 **ETA Predictions**: Predicción de tiempo mejorada  
🔮 **Weather Overlay**: Capa de clima  
🔮 **Heatmap**: Mapa de calor de entregas  
🔮 **Route Alternatives**: Rutas alternativas  
🔮 **Voice Navigation**: Navegación por voz

## 📝 Notas Importantes

- La API key incluida es de ejemplo, considerar reemplazarla en producción
- Google Maps tiene límites de uso gratuito (hasta $200/mes)
- Para producción, configurar restricciones en Google Cloud Console
- Las rutas se recalculan automáticamente cada vez que el repartidor se mueve
- El mapa funciona tanto en desktop como en dispositivos móviles

---

**Desarrollado con ❤️ usando Google Maps API, React, TypeScript y Supabase**
