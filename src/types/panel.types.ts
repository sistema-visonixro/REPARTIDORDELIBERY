// =====================================================
// TIPOS PARA PANELES DE USUARIOS
// =====================================================

// Panel Repartidor
export interface PanelRepartidor {
  repartidor_id: string;
  usuario_id: string;
  nombre_completo: string;
  telefono?: string;
  foto_url?: string;
  tipo_vehiculo?: string;
  estado: string;
  disponible: boolean;
  latitud_actual?: number;
  longitud_actual?: number;
  total_entregas: number;
  calificacion_promedio: number;
  entregas_hoy: number;
  ganancias_hoy: number;
  entregas_mes: number;
  ganancias_mes: number;
  pedido_activo?: {
    pedido_id: string;
    numero_pedido: string;
    estado: string;
    restaurante: string;
    direccion_entrega: string;
    total: number;
    tiempo_transcurrido: number;
  };
  creado_en: string;
  actualizado_en: string;
}

// Panel Restaurante
export interface PanelRestaurante {
  restaurante_id: string;
  nombre: string;
  descripcion?: string;
  imagen_url?: string;
  color_tema?: string;
  emoji?: string;
  calificacion: number;
  tiempo_entrega_min: number;
  costo_envio: number;
  activo: boolean;
  pedidos_hoy: number;
  pedidos_pendientes_hoy: number;
  pedidos_en_proceso_hoy: number;
  pedidos_completados_hoy: number;
  ingresos_hoy: number;
  pedidos_mes: number;
  pedidos_completados_mes: number;
  ingresos_mes: number;
  total_platillos: number;
  platillos_disponibles: number;
  total_bebidas: number;
  bebidas_disponibles: number;
  pedidos_pendientes?: Array<{
    pedido_id: string;
    numero_pedido: string;
    total: number;
    estado: string;
    creado_en: string;
    direccion_entrega: string;
  }>;
  platillo_mas_vendido?: {
    platillo_id: string;
    nombre: string;
    precio: number;
    veces_pedido: number;
  };
  created_at: string;
  updated_at: string;
}

// Panel Operador
export interface PanelOperador {
  pedidos_pendientes: number;
  pedidos_confirmados: number;
  pedidos_en_preparacion: number;
  pedidos_listos: number;
  pedidos_en_camino: number;
  pedidos_entregados_hoy: number;
  pedidos_cancelados_hoy: number;
  repartidores_disponibles: number;
  repartidores_en_entrega: number;
  repartidores_activos: number;
  total_repartidores: number;
  restaurantes_activos: number;
  total_restaurantes: number;
  ingresos_hoy: number;
  tiempo_promedio_entrega_hoy: number;
  pedidos_completados_mes: number;
  ingresos_mes: number;
  pedidos_retrasados: number;
  pedidos_sin_repartidor: number;
  pedidos_urgentes?: Array<{
    pedido_id: string;
    numero_pedido: string;
    restaurante: string;
    estado: string;
    tiempo_transcurrido: number;
    tiene_repartidor: boolean;
  }>;
  actualizado_en: string;
}

// Panel Admin
export interface PanelAdmin {
  total_usuarios: number;
  usuarios_nuevos_hoy: number;
  usuarios_nuevos_mes: number;
  total_pedidos_historico: number;
  pedidos_hoy: number;
  pedidos_mes: number;
  total_pedidos_completados: number;
  total_pedidos_cancelados: number;
  tasa_completacion_porcentaje: number;
  ingresos_totales: number;
  ingresos_hoy: number;
  ingresos_mes: number;
  ticket_promedio: number;
  tiempo_promedio_entrega_global: number;
  tiempo_promedio_entrega_hoy: number;
  total_restaurantes: number;
  restaurantes_activos: number;
  total_platillos: number;
  total_bebidas: number;
  total_repartidores: number;
  repartidores_disponibles: number;
  repartidores_en_entrega: number;
  calificacion_promedio_repartidores: number;
  top_restaurantes_mes?: Array<{
    id: string;
    nombre: string;
    emoji?: string;
    total_pedidos: number;
    ingresos: number;
  }>;
  top_repartidores_mes?: Array<{
    id: string;
    nombre_completo: string;
    calificacion_promedio: number;
    entregas_mes: number;
    ganancias_mes: number;
  }>;
  distribucion_estados: {
    pendiente: number;
    confirmado: number;
    en_preparacion: number;
    listo: number;
    en_camino: number;
    entregado: number;
    cancelado: number;
  };
  ventas_por_hora?: Array<{
    hora: number;
    pedidos: number;
    ingresos: number;
  }>;
  actualizado_en: string;
}
