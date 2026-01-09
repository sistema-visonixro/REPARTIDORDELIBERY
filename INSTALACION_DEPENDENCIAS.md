# 📦 Instalación de Dependencias

## Dependencias necesarias para el sistema completo

```bash
# Instalar todas las dependencias de una vez
npm install leaflet react-leaflet @types/leaflet

# O con yarn
yarn add leaflet react-leaflet @types/leaflet
```

## Dependencias individuales

### Para el mapa de tracking (OpenStreetMap con Leaflet)

```bash
npm install leaflet react-leaflet
npm install --save-dev @types/leaflet
```

### Alternativa: Mapbox (si prefieres usar Mapbox en lugar de OpenStreetMap)

```bash
npm install mapbox-gl react-map-gl
npm install --save-dev @types/mapbox-gl
```

## Configuración adicional

### 1. Agregar CSS de Leaflet en tu archivo principal

En `src/main.tsx` o `src/index.tsx`, agrega:

```typescript
import "leaflet/dist/leaflet.css";
```

### 2. Configurar React Router (si aún no lo tienes)

```bash
npm install react-router-dom
```

En `App.tsx`:

```typescript
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Importar páginas
import HomeClient from "./pages/HomeClient";
import PedidosDisponibles from "./pages/repartidor/PedidosDisponibles";
import EntregaActiva from "./pages/repartidor/EntregaActiva";
import DetallePedidoCliente from "./pages/DetallePedidoCliente";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas del cliente */}
        <Route path="/" element={<HomeClient />} />
        <Route path="/pedido/:pedidoId" element={<DetallePedidoCliente />} />

        {/* Rutas del repartidor */}
        <Route path="/repartidor">
          <Route path="disponibles" element={<PedidosDisponibles />} />
          <Route path="entrega/:pedidoId" element={<EntregaActiva />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

## Scripts de package.json

Asegúrate de tener estos scripts en tu `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  }
}
```

## Variables de entorno

Crea un archivo `.env` con:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

## Permisos del navegador

Para que funcione el tracking GPS, el navegador pedirá permisos de ubicación.

**IMPORTANTE**: En producción, necesitas HTTPS para que funcione la geolocalización.

## Ejecutar el proyecto

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm run preview
```

## Notas importantes

1. **Leaflet CSS**: Es crucial importar el CSS de Leaflet o los mapas no se verán correctamente.

2. **Permisos de ubicación**: El usuario debe aceptar los permisos de ubicación en el navegador.

3. **HTTPS en producción**: La API de geolocalización solo funciona en localhost o con HTTPS.

4. **Actualización de ubicación**: Por defecto está configurado para actualizar cada 60 segundos. Puedes ajustarlo en el servicio.

5. **OpenStreetMap es gratuito**: No tiene límites de solicitudes para uso normal.

## Alternativas de mapas

### Si prefieres Google Maps (requiere API key de pago)

```bash
npm install @react-google-maps/api
```

### Si prefieres Mapbox (50,000 solicitudes gratis/mes)

```bash
npm install mapbox-gl react-map-gl
```

Configuración de Mapbox en `.env`:

```env
VITE_MAPBOX_TOKEN=tu_token_de_mapbox
```

## Troubleshooting

### Los iconos del mapa no se ven

Asegúrate de importar el CSS y configurar los iconos:

```typescript
import "leaflet/dist/leaflet.css";
```

### Error "Cannot find module 'leaflet'"

```bash
npm install --save-dev @types/leaflet
```

### El mapa no se centra correctamente

Verifica que las coordenadas sean números válidos (no strings).

### La ubicación no se actualiza

- Verifica que el usuario haya dado permisos de ubicación
- Verifica que estés en HTTPS o localhost
- Abre la consola para ver errores de GPS
