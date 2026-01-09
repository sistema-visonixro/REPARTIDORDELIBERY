-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.bebidas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurante_id uuid NOT NULL,
  categoria_id uuid,
  nombre character varying NOT NULL,
  descripcion text,
  imagen_url text,
  precio numeric NOT NULL,
  descuento_porcentaje integer DEFAULT 0,
  disponible boolean DEFAULT true,
  tamano character varying,
  temperatura character varying,
  con_alcohol boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bebidas_pkey PRIMARY KEY (id),
  CONSTRAINT bebidas_restaurante_id_fkey FOREIGN KEY (restaurante_id) REFERENCES public.restaurantes(id),
  CONSTRAINT bebidas_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id)
);
CREATE TABLE public.categorias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre character varying NOT NULL UNIQUE,
  emoji character varying,
  color_gradiente_inicio character varying,
  color_gradiente_fin character varying,
  orden integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categorias_pkey PRIMARY KEY (id)
);
CREATE TABLE public.platillos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurante_id uuid NOT NULL,
  categoria_id uuid,
  nombre character varying NOT NULL,
  descripcion text,
  imagen_url text,
  precio numeric NOT NULL,
  descuento_porcentaje integer DEFAULT 0,
  disponible boolean DEFAULT true,
  tiempo_preparacion integer DEFAULT 15,
  calorias integer,
  es_vegetariano boolean DEFAULT false,
  es_picante boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT platillos_pkey PRIMARY KEY (id),
  CONSTRAINT platillos_restaurante_id_fkey FOREIGN KEY (restaurante_id) REFERENCES public.restaurantes(id),
  CONSTRAINT platillos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id)
);
CREATE TABLE public.restaurantes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre character varying NOT NULL,
  descripcion text,
  imagen_url text,
  color_tema character varying DEFAULT '#ff6b6b'::character varying,
  emoji character varying,
  calificacion numeric DEFAULT 0.0,
  tiempo_entrega_min integer DEFAULT 30,
  costo_envio numeric DEFAULT 0.00,
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT restaurantes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.usuarios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL UNIQUE,
  password character varying NOT NULL,
  nombre character varying NOT NULL,
  telefono character varying,
  direccion text,
  tipo_usuario character varying DEFAULT 'cliente'::character varying CHECK (tipo_usuario::text = ANY (ARRAY['cliente'::character varying, 'repartidor'::character varying, 'admin'::character varying]::text[])),
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT usuarios_pkey PRIMARY KEY (id)
);