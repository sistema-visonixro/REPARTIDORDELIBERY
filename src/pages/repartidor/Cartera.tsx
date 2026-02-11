import "./driver.css";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { obtenerPedidosRealizadosRepartidor } from "../../services/repartidor.service";
import { formatHNL } from "../../lib/currency";
import type { PedidoRealizadoRepartidor } from "../../types/repartidor.types";

export default function Cartera() {
  const { usuario } = useAuth();
  const [pedidos, setPedidos] = useState<PedidoRealizadoRepartidor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const getWeekRange = (baseDate: Date) => {
    const day = baseDate.getDay();
    const diffToMonday = (day + 6) % 7;
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return {
      start: monday.toISOString().slice(0, 10),
      end: sunday.toISOString().slice(0, 10),
    };
  };

  useEffect(() => {
    if (!desde && !hasta) {
      const range = getWeekRange(new Date());
      setDesde(range.start);
      setHasta(range.end);
    }
  }, [desde, hasta]);

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      if (!usuario) return;
      setLoading(true);
      try {
        const data = await obtenerPedidosRealizadosRepartidor(usuario.id);
        if (activo) setPedidos(data);
      } catch (err: any) {
        console.error("Error cargando pedidos:", err);
        if (activo) setError("No se pudieron cargar los pedidos");
      } finally {
        if (activo) setLoading(false);
      }
    };
    cargar();
    return () => {
      activo = false;
    };
  }, [usuario]);

  const getPedidoDate = (pedido: PedidoRealizadoRepartidor) => {
    return pedido.entregado_en || pedido.registrado_en || null;
  };

  const filtrados = useMemo(() => {
    const start = desde ? new Date(`${desde}T00:00:00`) : null;
    const end = hasta ? new Date(`${hasta}T23:59:59`) : null;

    return pedidos
      .filter((pedido) => {
        const raw = getPedidoDate(pedido);
        if (!raw) return false;
        const current = new Date(raw);
        if (Number.isNaN(current.getTime())) return false;
        if (start && current < start) return false;
        if (end && current > end) return false;
        return true;
      })
      .sort((a, b) => {
        const aDate = getPedidoDate(a);
        const bDate = getPedidoDate(b);
        return new Date(bDate || 0).getTime() - new Date(aDate || 0).getTime();
      });
  }, [pedidos, desde, hasta]);

  const stats = useMemo(() => {
    const saldo = filtrados.reduce((acc, p) => acc + (p.total || 0), 0);
    const realizados = filtrados.length;
    return {
      saldo,
      viajes: realizados,
      realizados,
      cancelados: 0,
      rechazados: 0,
      total: filtrados.length,
    };
  }, [filtrados]);

  return (
    <div className="wallet-page">
      <div className="wallet-hero">
        <div>
          <h2>Cartera</h2>
          <p>Resumen de pedidos y movimientos del repartidor.</p>
        </div>
        <div className="wallet-balance">
          <span>Saldo</span>
          <strong>{formatHNL(stats.saldo)}</strong>
        </div>
      </div>

      <div className="wallet-filters">
        <div className="filter-field">
          <label>Desde</label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />
        </div>
        <div className="filter-field">
          <label>Hasta</label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
          />
        </div>
        <button
          className="btn-ghost"
          type="button"
          onClick={() => {
            setDesde("");
            setHasta("");
          }}
        >
          Limpiar
        </button>
      </div>

      <div className="wallet-grid">
        <div className="stat-card">
          <span>Pedidos realizados</span>
          <strong>{stats.realizados}</strong>
        </div>
        <div className="stat-card">
          <span>Cancelados</span>
          <strong>{stats.cancelados}</strong>
        </div>
        <div className="stat-card">
          <span>Rechazados</span>
          <strong>{stats.rechazados}</strong>
        </div>
        <div className="stat-card highlight">
          <span>Viajes</span>
          <strong>{stats.viajes}</strong>
        </div>
      </div>

      <div className="wallet-list">
        <div className="list-header">
          <h3>Pedidos</h3>
          <span>{stats.total} resultados</span>
        </div>

        {loading && <div className="wallet-empty">Cargando pedidos...</div>}
        {error && <div className="wallet-empty">{error}</div>}
        {!loading && !error && filtrados.length === 0 && (
          <div className="wallet-empty">No hay pedidos en este rango.</div>
        )}

        {!loading &&
          !error &&
          filtrados.map((pedido) => {
            return (
              <div key={pedido.pedido_id} className="wallet-item">
                <div>
                  <p className="order-title">
                    {pedido.restaurante_emoji || "🍽️"}{" "}
                    {pedido.restaurante_nombre || "Pedido"}
                  </p>
                  <p className="order-sub">
                    #{pedido.numero_pedido || "-"}{" "}
                    {pedido.direccion_entrega
                      ? `• ${pedido.direccion_entrega}`
                      : ""}
                  </p>
                </div>
                <div className="order-meta">
                  <span className="status-pill ok">Realizado</span>
                  <strong>{formatHNL(pedido.total)}</strong>
                  <small>
                    {getPedidoDate(pedido)
                      ? new Date(
                          getPedidoDate(pedido) as string,
                        ).toLocaleString()
                      : "-"}
                  </small>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
