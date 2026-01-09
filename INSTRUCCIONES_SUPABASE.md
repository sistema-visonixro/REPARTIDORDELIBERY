# 📋 Instrucciones para Configurar Supabase

## Paso 1: Ejecutar el Schema Principal

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. En el menú lateral, selecciona **SQL Editor**
3. Haz clic en **New Query**
4. Copia TODO el contenido del archivo `schema_restaurantes.sql`
5. Pégalo en el editor
6. Haz clic en **Run** (botón verde en la esquina inferior derecha)
7. Espera a que termine (puede tardar 10-20 segundos)

**✅ Esto creará:**

- Tablas: `restaurantes`, `categorias`, `platillos`, `bebidas`
- Datos de ejemplo (5 restaurantes, 4 categorías, 12 platillos, 9 bebidas)
- Triggers automáticos para actualizar `updated_at`

---

## Paso 2: Configurar Permisos RLS

1. En el **SQL Editor**, crea una nueva query
2. Copia TODO el contenido del archivo `schema_permisos_rls.sql`
3. Pégalo en el editor
4. Haz clic en **Run**

**✅ Esto configurará:**

- Row Level Security (RLS) en todas las tablas
- Permisos de lectura pública para que la app pueda consultar los datos
- Sin necesidad de autenticación para ver restaurantes/platillos

---

## Paso 3: Verificar que las Tablas Existen

1. En el menú lateral, selecciona **Table Editor**
2. Deberías ver estas tablas:

   - ✅ `restaurantes` (5 filas)
   - ✅ `categorias` (4 filas)
   - ✅ `platillos` (12 filas)
   - ✅ `bebidas` (9 filas)
   - ✅ `usuarios` (tu tabla anterior)

3. Haz clic en cada tabla para ver los datos

---

## Paso 4: Verificar la Conexión en la App

1. Abre la consola del navegador (F12)
2. Ve a la pestaña **Console**
3. Busca mensajes de error como:
   - ❌ "relation 'restaurantes' does not exist" → Ejecuta Paso 1
   - ❌ "permission denied" → Ejecuta Paso 2
   - ✅ Si no hay errores, ¡todo funciona!

---

## 🔍 Solución de Problemas

### Problema: "relation does not exist"

**Solución:** Las tablas no fueron creadas. Vuelve al Paso 1.

### Problema: "permission denied for table"

**Solución:** RLS está bloqueando el acceso. Ejecuta el Paso 2.

### Problema: "Failed to fetch"

**Solución:** Verifica tu URL y API Key en `src/lib/supabase.ts`:

```typescript
const supabaseUrl = "https://jqhiubituqmwouaszjpc.supabase.co";
const supabaseAnonKey = "tu-anon-key-aqui";
```

### Problema: La app muestra datos pero dice "No hay restaurantes"

**Solución:** Los datos de respaldo están funcionando. Revisa la consola para ver el error específico.

---

## 🎯 Comandos Útiles de SQL

### Ver todos los restaurantes:

```sql
SELECT * FROM restaurantes;
```

### Ver categorías:

```sql
SELECT * FROM categorias ORDER BY orden;
```

### Ver platillos con su restaurante:

```sql
SELECT p.nombre, r.nombre as restaurante, p.precio
FROM platillos p
JOIN restaurantes r ON p.restaurante_id = r.id;
```

### Ver bebidas con su restaurante:

```sql
SELECT b.nombre, r.nombre as restaurante, b.precio, b.tamano
FROM bebidas b
JOIN restaurantes r ON b.restaurante_id = r.id;
```

### Verificar permisos RLS:

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

---

## ✨ Una vez configurado correctamente:

- ✅ El carrusel mostrará las imágenes reales de restaurantes
- ✅ Las 4 tarjetas de categorías se cargarán dinámicamente
- ✅ Los datos se actualizarán automáticamente desde la BD
- ✅ Podrás agregar más restaurantes desde el Table Editor

---

## 📝 Notas Importantes:

1. **Datos de Respaldo:** La app tiene datos de respaldo si Supabase falla, así que siempre verás algo en pantalla
2. **Imágenes:** Las URLs de Unsplash son ejemplos. Puedes cambiarlas por tus propias imágenes
3. **RLS:** Los permisos actuales permiten lectura pública. Para operaciones de escritura necesitarás autenticación
4. **API Key:** Usa el **anon/public key**, NO el service_role key en el frontend
