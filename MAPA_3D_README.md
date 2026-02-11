# Mapa 3D Moderno para Repartidores 🚚🗺️

## ✨ 100% Gratuito - Sin API Keys Requeridas

Este mapa 3D utiliza **MapLibre GL** (open-source) con **OpenStreetMap** y **OSRM** - completamente gratuito y sin límites.

## Características Principales

### Vista 3D Inmersiva

- **Pitch de 60°**: Vista inclinada que simula perspectiva real
- **Terreno 3D**: Elevaciones del terreno con exageración de 1.5x
- **Edificios 3D**: Renderizado volumétrico de edificios con gradientes de color
- **Rotación automática**: Animación inicial de 360° para mostrar el entorno

### Efectos Visuales Modernos

#### Marcadores Avanzados

- **Pulso animado**: Efecto de onda expansiva en cada marcador
- **Flotación suave**: Animación de levitación continua
- **Iconos emoji**: 🍽️ Restaurante, 🚚 Repartidor, 🏠 Cliente
- **Sombras realistas**: Drop-shadow para profundidad
- **Glow en hover**: Efecto de brillo al pasar el cursor

#### Ruta con Degradado

- **Línea gradiente**: Color que cambia de morado a rosa (#667eea → #f093fb)
- **Sombra de ruta**: Capa inferior con blur para profundidad
- **Grosor dinámico**: Línea de 6px con bordes redondeados
- **API de direcciones**: Cálculo real de ruta por calles usando Mapbox

### Panel de Información Flotante

#### Glassmorphism Design

- **Fondo difuminado**: backdrop-filter con blur de 20px
- **Semi-transparencia**: rgba(255, 255, 255, 0.95)
- **Bordes suaves**: border-radius de 16px
- **Sombras profundas**: box-shadow multicapa

#### Datos en Tiempo Real

- 🚚 Estado del repartidor con indicador pulsante
- 📍 Distancia calculada en kilómetros
- ⏱️ Tiempo estimado de llegada en minutos
- Animaciones de entrada (slideInLeft)

### Tracking en Vivo

#### Actualización Automática

- **Supabase Realtime**: Suscripción a cambios en tabla `ubicacion_real`
- **Animación de movimiento**: Transición suave del marcador del repartidor
- **Reajuste de vista**: Bounds automáticos para mostrar toda la ruta
- **Sin recargas**: Actualización fluida sin parpadeos

### Controles de Navegación

#### Interactividad

- **Controles 3D**: Navegación con visualización de pitch
- **Pantalla completa**: Botón de fullscreen
- **Zoom suave**: Transiciones animadas
- **Rotación libre**: Bearing ajustable con gestos

### Tema Oscuro Nocturno

- **Estilo**: `navigation-night-v1` de Mapbox
- **Contraste mejorado**: 110% contrast, 105% brightness
- **Edificios iluminados**: Gradientes de color vibrantes
- **Mejor legibilidad**: Alto contraste para modo conductor nocturno

## Tecnologías Utilizadas

### Librerías (100% Gratuitas)

- **MapLibre GL JS**: Motor de mapas open-source con WebGL
- **OpenStreetMap**: Tiles de mapa gratuitos
- **OSRM**: Cálculo de rutas (Open Source Routing Machine)
- **React + TypeScript**: Framework y tipado
- **Supabase Realtime**: WebSocket para tracking en vivo

### Efectos CSS

- **Glassmorphism**: backdrop-filter, blur
- **Animaciones**: keyframes para pulso, flotación, rotación
- **Gradientes**: linear-gradient en múltiples elementos
- **Drop-shadows**: filter para profundidad

## Configuración Requerida

✅ Sin Configuración Necesaria

Este mapa **NO requiere API keys** ni configuración adicional. Funciona inmediatamente después de la instalación.

Todo es gratuito:

- MapLibre GL: Open-source, sin límites
- OpenStreetMap: Tiles gratuitos
- OSRM: Routing gratuito
- MapLibre Terrain: DEM tiles gratuitosboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

````

## Personalización

### Cambiar Estilo del Mapa

En `MapaRutaProfesional3D.tsx`, línea ~120:

```typescript
style: "mapbox://styles/mapbox/navigation-night-v1"
````

Estilos disponibles:

- `streets-v12`: Calles estándar
- `outdoors-v12`: Topográfico
- `light-v11`: Tema claro
- `dark-v11`: Tema oscuro
- `satellite-v9`: Vista satelital
- `satellite-streets-v12`: Satélite + calles
- `navigation-day-v1`: Navegación diurna
- `navigation-night-v1`: Navegación nocturna ⭐ (actual)

### Ajustar Vista 3D

l mapa usa OpenStreetMap por defecto. Puedes cambiar a otros proveedores gratuitos en `MapaRutaProfesional3D.tsx`:

````typescript
// Carto Dark Matter (oscuro)
tiles: ["https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"]

// Carto Voyager (colorido)
tiles: ["https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"]

// Stamen Terrain (relieve)función `actualizarRuta`:

```typescript
paint: {
  "line-color": "#00D4FF", // Cambia este color
  "line-width": 6,
}
````

Colores sugeridos:

- `#00D4FF`: Cian brillante (actual)
- `#667eea`: Morado
- `#f093fb`: Rosa
- `#4caf50`: Verde
- `#ff5722`: Naranja

### Personalizar Animaciones

En `MapaRutaProfesional3D.css`:

```css
@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) scale(2.5);
    opacity: 0;
  }
}
```

## Responsive Design

El componente se adapta automáticamente a dispositivos móviles:

- **Desktop**: Altura 600px, controles completos
- **Mobile**: Altura 500px, controles compactos
- # Rendimiento

### Optimizaciones Implementadas

- **WebGL acelerado**: Renderizado por GPU
- **Límite de zoom**: Buildings 3D solo desde zoom 15
- **Tiles bajo demanda**: Carga progresiva
- **Cache del navegador**: Tiles se cachean automáticamente
- **Throttling**: Actualizaciones optimizadas
- **Cleanup**: Limpieza de recursos en desmontaje

### Sin Límites

- ✅ Sin límites de cargas de mapa
- ✅ Sin límites de requests de routing
- ✅ Sin costs ocultos
- ✅ Funciona offline (con tiles cacheados)
- Usa throttling en actualizaciones GPS (cada 5-10 segundos)
- Limita el terreno 3D en conexiones lentas
- Considera deshabilitar buildings 3D en dispositivos antiguos

## Troubleshooting

### El mapa no carga

- Verifica el token de Mapbox
- Revisa la consola del navegador
- Confirma conectividad a internet

### Marcadores no aparecen

- Verifica que haya al menos 2 waypoints
- Confirma conectividad a OSRM (router.project-osrm.org)
- OSRM es público y puede tener límites de rate (1 request/segundo recomendado

### Ruta no se dibuja

- Verifica la API key de Mapbox Directions
- Confirma que haya al menos 2 waypoints
- Revisa límites de uso de la API (gratis: 100k requests/mes)

### Tracking no actualiza

- Verifica conexión a Supabase
- Confirma que la tabla `ubicacion_real` existe
- Revisa permisos RLS de la tabla

## Próximas Mejoras Sugeridas

- [ ] Modo offline con tiles cacheados
- [ ] Indicador de tráfico en tiempo real
- [ ] Voz de navegación turn-by-turn
- [ ] Múltiples paradas en la ruta
- [ ] Historial de rutas completadas
- [ ] Modo clima (lluvia, nieve)
- [ ] Modo ahorro de batería
- [ ] Integración con Waze/Google Traffic

## Licencia y Créditos

- **Mapbox GL JS**: BSD License
- **Iconos Emoji**: Unicode Standard
- **Diseño**: Custom por Copilot 2026

---

**Nota**: Este componente reemplaza completamente a `MapaRutaProfesional.tsx` que usaba Leaflet. El nuevo mapa ofrece una experiencia visual superior y mejor rendimiento en dispositivos modernos.
