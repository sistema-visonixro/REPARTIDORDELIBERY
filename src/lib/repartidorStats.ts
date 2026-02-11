type PedidoLike = {
  estado?: string | null;
  total?: number | null;
  creado_en?: string | null;
};

export type PedidoStats = {
  saldo: number;
  viajes: number;
  realizados: number;
  cancelados: number;
  rechazados: number;
  total: number;
};

export function filterPedidosByDate<T extends PedidoLike>(
  pedidos: T[],
  startDate?: string,
  endDate?: string,
  field: keyof T = "creado_en" as keyof T,
) {
  const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
  const end = endDate ? new Date(`${endDate}T23:59:59`) : null;

  return pedidos.filter((pedido) => {
    const raw = pedido[field] as unknown as string | null | undefined;
    if (!raw) return false;
    const current = new Date(raw);
    if (Number.isNaN(current.getTime())) return false;
    if (start && current < start) return false;
    if (end && current > end) return false;
    return true;
  });
}

export function computePedidoStats<T extends PedidoLike>(
  pedidos: T[],
): PedidoStats {
  const realizados = pedidos.filter((p) => p.estado === "entregado").length;
  const cancelados = pedidos.filter((p) => p.estado === "cancelado").length;
  const rechazados = pedidos.filter((p) =>
    (p.estado || "").toLowerCase().includes("rechaz"),
  ).length;
  const saldo = pedidos
    .filter((p) => p.estado === "entregado")
    .reduce((acc, p) => acc + (p.total || 0), 0);

  return {
    saldo,
    viajes: realizados,
    realizados,
    cancelados,
    rechazados,
    total: pedidos.length,
  };
}
