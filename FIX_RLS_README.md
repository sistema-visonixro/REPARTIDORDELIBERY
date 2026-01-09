# 🔧 FIX: Error RLS en Carrito

## 🐛 Problema

```
POST https://jqhiubituqmwouaszjpc.supabase.co/rest/v1/carrito 401 (Unauthorized)
Error: new row violates row-level security policy for table "carrito"
```

## 🔍 Causa

El frontend usa un **AuthContext personalizado** con localStorage:

- `usuario.id` viene del localStorage
- NO está autenticado con Supabase Auth

Las políticas RLS esperan:

- `auth.uid()` de Supabase Auth
- Usuario autenticado en Supabase

## ✅ Solución Rápida (Desarrollo)

### 1. Ejecuta este SQL en Supabase:

```sql
-- Deshabilitar RLS temporalmente para desarrollo
ALTER TABLE carrito DISABLE ROW LEVEL SECURITY;
```

O ejecuta el archivo completo:

```bash
# En Supabase SQL Editor
- Abre: sql/FIX_RLS_CARRITO.sql
- Ejecuta todo el contenido
```

### 2. Reinicia el servidor dev

```bash
npm run dev
```

### 3. Prueba agregar al carrito

Ahora debería funcionar sin el error 401.

---

## 🎯 Solución Correcta (Producción)

Para producción, tienes **3 opciones**:

### Opción A: Usar Supabase Auth (RECOMENDADO)

Reemplaza el AuthContext personalizado por Supabase Auth:

```tsx
// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**Ventajas:**

- ✅ RLS funciona correctamente
- ✅ Sesión persistente automática
- ✅ Tokens JWT seguros
- ✅ Renovación automática

### Opción B: Crear JWT Custom en tu Backend

Si quieres mantener tu sistema de auth personalizado:

1. Crea un backend que genere JWT válidos para Supabase
2. Usa `supabase.auth.setSession()` con ese JWT
3. Las políticas RLS funcionarán

### Opción C: Políticas RLS Basadas en Columna

Cambiar las políticas RLS para validar contra la columna `usuario_id`:

```sql
-- Crear función para obtener usuario desde JWT custom
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('request.jwt.claims', true)::json->>'user_id';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas RLS usando la función
DROP POLICY IF EXISTS "Usuarios pueden ver su carrito" ON carrito;
CREATE POLICY "Usuarios pueden ver su carrito"
  ON carrito FOR SELECT
  USING (usuario_id = get_current_user_id());

-- Repetir para INSERT, UPDATE, DELETE
```

---

## 📋 Checklist para Migrar a Supabase Auth

Si decides usar Supabase Auth (opción A), sigue estos pasos:

### 1. Backend (Supabase)

- [ ] Crea usuarios en Supabase Auth Dashboard
- [ ] O permite registro público: Auth Settings > Enable Sign Up
- [ ] Configura email/password provider

### 2. Frontend

**Archivos a modificar:**

- [ ] `src/context/AuthContext.tsx` - Usar Supabase Auth
- [ ] `src/pages/Login.tsx` - Usar `signIn()` de Supabase
- [ ] `src/pages/Carrito.tsx` - Cambiar `usuario.id` por `user?.id`
- [ ] `src/pages/DetallePlatillo.tsx` - Cambiar `usuario.id` por `user?.id`
- [ ] `src/pages/Pedidos.tsx` - Cambiar `usuario.id` por `user?.id`
- [ ] Todos los archivos de repartidor - Cambiar `usuario` por `user`

### 3. Base de Datos

- [ ] Habilitar RLS de nuevo:
  ```sql
  ALTER TABLE carrito ENABLE ROW LEVEL SECURITY;
  ```
- [ ] Restaurar políticas originales (están en `sql/02_crear_tabla_carrito.sql`)

---

## 🚀 Aplicar las Mismas Correcciones a Otras Tablas

Si encuentras errores similares en otras tablas:

```sql
-- Deshabilitar RLS en todas las tablas principales
ALTER TABLE pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE repartidores DISABLE ROW LEVEL SECURITY;
ALTER TABLE ubicaciones_repartidor DISABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones DISABLE ROW LEVEL SECURITY;
```

O crear políticas permisivas para desarrollo:

```sql
-- Ejemplo para pedidos
DROP POLICY IF EXISTS "Usuarios ven sus pedidos" ON pedidos;
CREATE POLICY "Desarrollo: ver pedidos"
  ON pedidos FOR SELECT
  TO authenticated
  USING (true);
```

---

## 📚 Recursos

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)

---

## ⚠️ ADVERTENCIA

**NO uses `DISABLE ROW LEVEL SECURITY` en producción.**

Es solo para desarrollo local. En producción:

- Implementa Supabase Auth correctamente
- O crea un sistema de JWT válido
- O usa políticas RLS basadas en otros criterios seguros
