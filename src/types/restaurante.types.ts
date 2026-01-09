// =====================================================
// TIPOS PARA GESTIÓN DE RESTAURANTES
// =====================================================

export interface Restaurante {
  id: string;
  nombre: string;
  descripcion?: string;
  imagen_url?: string;
  color_tema?: string;
  emoji?: string;
  calificacion: number;
  tiempo_entrega_min: number;
  costo_envio: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CrearRestaurante {
  nombre: string;
  descripcion?: string;
  imagen_url?: string;
  color_tema?: string;
  emoji?: string;
  usuario_id?: string;
  tiempo_entrega_min: number;
  costo_envio: number;
}

export interface ActualizarRestaurante {
  nombre?: string;
  descripcion?: string;
  imagen_url?: string;
  color_tema?: string;
  emoji?: string;
  tiempo_entrega_min?: number;
  costo_envio?: number;
  activo?: boolean;
}

export interface Platillo {
  id: string;
  restaurante_id: string;
  categoria_id?: string;
  nombre: string;
  descripcion?: string;
  imagen_url?: string;
  precio: number;
  descuento_porcentaje: number;
  disponible: boolean;
  tiempo_preparacion: number;
  calorias?: number;
  es_vegetariano: boolean;
  es_picante: boolean;
  created_at: string;
  updated_at: string;
}

export interface CrearPlatillo {
  restaurante_id: string;
  categoria_id?: string;
  nombre: string;
  descripcion?: string;
  imagen_url?: string;
  precio: number;
  descuento_porcentaje?: number;
  disponible?: boolean;
  tiempo_preparacion?: number;
  calorias?: number;
  es_vegetariano?: boolean;
  es_picante?: boolean;
}

export interface ActualizarPlatillo {
  nombre?: string;
  descripcion?: string;
  imagen_url?: string;
  precio?: number;
  descuento_porcentaje?: number;
  disponible?: boolean;
  tiempo_preparacion?: number;
  calorias?: number;
  es_vegetariano?: boolean;
  es_picante?: boolean;
  categoria_id?: string;
}

export interface Bebida {
  id: string;
  restaurante_id: string;
  categoria_id?: string;
  nombre: string;
  descripcion?: string;
  imagen_url?: string;
  precio: number;
  descuento_porcentaje: number;
  disponible: boolean;
  tamano?: string;
  temperatura?: string;
  con_alcohol: boolean;
  created_at: string;
  updated_at: string;
}

export interface CrearBebida {
  restaurante_id: string;
  categoria_id?: string;
  nombre: string;
  descripcion?: string;
  imagen_url?: string;
  precio: number;
  descuento_porcentaje?: number;
  disponible?: boolean;
  tamano?: string;
  temperatura?: string;
  con_alcohol?: boolean;
}

export interface PedidoRestaurante {
  id: string;
  numero_pedido: string;
  usuario_id: string;
  restaurante_id: string;
  repartidor_id?: string;
  total: number;
  estado: string;
  direccion_entrega: string;
  latitud?: number;
  longitud?: number;
  notas_cliente?: string;
  creado_en: string;
  confirmado_en?: string;
  cliente_nombre?: string;
  cliente_telefono?: string;
  detalles?: DetallePedido[];
}

export interface DetallePedido {
  id: string;
  pedido_id: string;
  platillo_id?: string;
  bebida_id?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  notas?: string;
  platillo_nombre?: string;
  bebida_nombre?: string;
}
