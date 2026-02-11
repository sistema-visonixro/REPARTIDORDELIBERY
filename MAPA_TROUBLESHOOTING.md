# Troubleshooting - Mapa 3D No Visible

## Problema Resuelto ✅

Se aplicaron las siguientes correcciones para el mapa oscuro/no visible:

### 1. Z-index Corregidos

- Contenedor del mapa: `z-index: 1`
- Canvas del mapa: posición absoluta con height 100%
- Paneles flotantes: `z-index: 10` (antes estaban en 1000, cubriendo todo)

### 2. Estilos de Contenedor

```css
.mapa-3d-container {
  background: #f5f5f5; /* Fondo claro por defecto */
  z-index: 1;
}

.map-3d {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 1;
}
```

### 3. Canvas Visible

```css
.map-3d canvas {
  position: absolute;
  width: 100% !important;
  height: 100% !important;
}
```

### 4. Configuración Simplificada

- Removido temporalmente el terreno 3D que podía causar pantalla negra
- Pitch reducido de 60° a 45° para mejor visibilidad inicial
- Agregados logs de consola para debugging

### 5. Estilo en Página de Repartidor

```css
.mobile-viewport .mapa-3d-container {
  background: #fff;
  margin: 20px 0;
}
```

## Cómo Verificar que Funciona

### 1. Abrir Consola del Navegador (F12)

Debes ver estos logs cuando el mapa carga:

```
Mapa inicializado con centro: [lng, lat]
Mapa cargado exitosamente
Edificios 3D agregados
Marcadores agregados al mapa
```

### 2. Verificar Coordenadas

El mapa necesita coordenadas válidas. Si ves coordenadas como `[0, 0]` o `[NaN, NaN]`, el problema está en los datos del pedido.

### 3. Verificar Tiles de OpenStreetMap

- Abre las herramientas de desarrollo (F12)
- Ve a la pestaña "Network"
- Filtra por "tile.openstreetmap.org"
- Debes ver requests con status 200

## Errores Comunes

### Mapa Completamente Negro

**Causa**: Terreno 3D o tiles no cargando
**Solución**: Ya simplificada la configuración para usar solo OSM básico

### Panel de Información Cubre Todo

**Causa**: Z-index muy alto (1000)
**Solución**: Reducido a z-index: 10

### Mapa No Se Ve, Solo Fondo Gris

**Causa**:

- Coordenadas inválidas (null, undefined, NaN)
- Red bloqueando tile.openstreetmap.org
  **Solución**: Verificar que el pedido tenga lat/lng válidos

### Canvas Desplazado o Mal Posicionado

**Causa**: Estilos conflictivos
**Solución**: Agregado `position: absolute` y `!important` en width/height

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Ver errores de consola mientras desarrollas
# F12 > Console (en el navegador)
```

## Ejemplo de Coordenadas Válidas

Para México (CDMX):

- Latitud: 19.4326
- Longitud: -99.1332

Para España (Madrid):

- Latitud: 40.4168
- Longitud: -3.7038

## Próximos Pasos

Si el mapa ya se ve correctamente:

1. ✅ Se puede reactivar el terreno 3D
2. ✅ Se puede aumentar el pitch a 60°
3. ✅ Se puede descomentar la animación de rotación

## Logs de Debug Agregados

Los siguientes logs están activos en el código:

- "Mapa inicializado con centro: [lng, lat]"
- "Mapa cargado exitosamente"
- "Edificios 3D agregados"
- "Marcadores agregados al mapa"
- "Error en el mapa: " (en caso de error)

Para removerlos después, busca `console.log` y `console.error` en:

- `src/components/MapaRutaProfesional3D.tsx`
