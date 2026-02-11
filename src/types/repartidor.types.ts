// =====================================================
// PORTAL DEL REPARTIDOR - Tipos TypeScript
// =====================================================

export interface Repartidor {
  id: string;
  usuario_id: string;
  nombre_completo: string;
  telefono: string | null;
  foto_url: string | null;
  tipo_vehiculo: "bicicleta" | "moto" | "auto" | "a_pie" | null;
  placa_vehiculo: string | null;
  clave?: string | null;
  estado: "activo" | "inactivo" | "en_entrega" | "pausado";
  disponible: boolean;
  latitud_actual: number | null;
  longitud_actual: number | null;
  ultima_actualizacion_ubicacion: string | null;
  total_entregas: number;
  calificacion_promedio: number;
}

export interface PedidoRepartidor {
  pedido_id: string;
  repartidor_id: string;
  numero_pedido: string;
  total: number;
  estado: string;
  direccion_entrega: string;
  latitud: number;
  longitud: number;
  notas_cliente: string | null;
  creado_en: string;
  asignado_en: string;
  restaurante_nombre: string;
  restaurante_direccion: string;
  restaurante_emoji: string;
  restaurante_telefono: string;
  cliente_email: string;
  total_items: number;
  minutos_desde_asignacion: number;
}

export interface PedidoDisponible {
  pedido_id: string;
  numero_pedido: string;
  total: number;
  estado: string;
  direccion_entrega: string;
  latitud: number;
  longitud: number;
  creado_en: string;
  restaurante_nombre: string;
  restaurante_direccion: string;
  restaurante_emoji: string;
  total_items: number;
  minutos_desde_creacion: number;
}

export interface PedidoRealizadoRepartidor {
  pedido_id: string;
  repartidor_id: string;
  entregado_en: string;
  registrado_en: string;
  total: number | null;
  numero_pedido: string | null;
  restaurante_id?: string | null;
  restaurante_nombre?: string;
  restaurante_emoji?: string;
  direccion_entrega?: string | null;
  estado?: string | null;
}

export interface Aviso {
  id: string;
  titulo: string;
  mensaje: string;
  prioridad: "alta" | "media" | "baja";
  fecha_inicio: string | null;
  fecha_fin: string | null;
  creado_en: string;
}

export interface UbicacionTracking {
  pedido_id: string;
  repartidor_id: string;
  repartidor_latitud: number;
  repartidor_longitud: number;
  velocidad: number | null;
  ultima_actualizacion: string;
  estado: string;
  cliente_latitud: number;
  cliente_longitud: number;
  direccion_entrega: string;
  repartidor_nombre: string;
  repartidor_telefono: string;
  tipo_vehiculo: string;
  segundos_desde_actualizacion: number;
}
