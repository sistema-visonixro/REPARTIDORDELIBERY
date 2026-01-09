# 🚀 Delibery - App de Delivery

Aplicación web de delivery desarrollada con React, TypeScript, Vite y Supabase.

## 🎨 Características

- ✅ Sistema de autenticación con Supabase
- 🌓 Tema dark/light con colores morados
- 📱 Totalmente responsive (móvil, tablet, desktop)
- 🎯 Interfaz moderna y animada
- 🔐 Rutas protegidas

## 🛠️ Tecnologías

- **Frontend**: React 19 + TypeScript
- **Estilos**: CSS vanilla con variables CSS
- **Routing**: React Router DOM
- **Base de datos**: Supabase
- **Build tool**: Vite

## 📋 Requisitos previos

- Node.js 18+
- npm o yarn
- Cuenta de Supabase

## 🚀 Instalación

1. **Clonar el repositorio**

```bash
git clone https://github.com/deliberyroatan-creator/Delibery.git
cd Delibery
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar Supabase**

Ejecuta el SQL en el SQL Editor de Supabase (archivo `supabase-setup.sql`):

```sql
-- Crea la tabla usuarios y datos de prueba
-- Ver archivo completo en: supabase-setup.sql
```

4. **Iniciar el servidor de desarrollo**

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 👤 Usuarios de prueba

### Cliente

- **Email**: cliente@test.com
- **Password**: cliente123

### Admin

- **Email**: admin@delibery.com
- **Password**: admin123

## 📁 Estructura del proyecto

```
Delibery/
├── src/
│   ├── context/
│   │   ├── AuthContext.tsx      # Contexto de autenticación
│   │   └── ThemeContext.tsx     # Contexto de tema dark/light
│   ├── lib/
│   │   └── supabase.ts          # Cliente y funciones de Supabase
│   ├── pages/
│   │   ├── Login.tsx            # Página de inicio de sesión (estilada con Tailwind)
│   │   ├── HomeClient.tsx       # Dashboard del cliente
│   │   └── HomeClient.css
│   ├── App.tsx                  # Configuración de rutas
│   ├── App.css
│   ├── index.css                # Estilos globales, variables y directivas Tailwind
│   └── main.tsx
├── supabase-setup.sql           # Script SQL para Supabase
├── package.json
└── README.md
```

## 🎨 Tema de colores

### Light Mode

- **Primary**: #7c3aed (Morado)
- **Secondary**: #9333ea
- **Background**: #ffffff

### Dark Mode

- **Primary**: #a855f7 (Morado claro)
- **Secondary**: #c084fc
- **Background**: #0f0a1f (Morado oscuro)

## 📱 Responsive

La aplicación está optimizada para:

- 📱 Móviles: < 480px
- 📱 Tablets: 480px - 768px
- 💻 Desktop: > 768px

## 🔐 Configuración de Supabase

### URL y API Key

Las credenciales están configuradas en `src/lib/supabase.ts`:

```typescript
const supabaseUrl = "https://jqhiubituqmwouaszjpc.supabase.co";
const supabaseAnonKey = "tu_clave_aqui";
```

### Tabla de usuarios

La tabla `usuarios` incluye:

- id (UUID)
- email (VARCHAR)
- password (VARCHAR)
- nombre (VARCHAR)
- telefono (VARCHAR)
- direccion (TEXT)
- tipo_usuario (VARCHAR): 'cliente', 'repartidor', 'admin'
- activo (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

## 🚧 Próximas características

- [ ] Gestión de pedidos
- [ ] Mapa interactivo de entregas
- [ ] Sistema de calificaciones
- [ ] Chat en tiempo real
- [ ] Notificaciones push
- [ ] Panel de repartidor
- [ ] Panel de administrador

## 📝 Scripts disponibles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y confidencial.

## 👨‍💻 Autor

**Delibery Team**

---

⭐ Si te gusta este proyecto, dale una estrella en GitHub!

import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
globalIgnores(['dist']),
{
files: ['**/*.{ts,tsx}'],
extends: [
// Other configs...
// Enable lint rules for React
reactX.configs['recommended-typescript'],
// Enable lint rules for React DOM
reactDom.configs.recommended,
],
languageOptions: {
parserOptions: {
project: ['./tsconfig.node.json', './tsconfig.app.json'],
tsconfigRootDir: import.meta.dirname,
},
// other options...
},
},
])

```

```
