import "./driver.css";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { obtenerPedidosRealizadosRepartidor } from "../../services/repartidor.service";
import { formatHNL } from "../../lib/currency";

export default function EarningsCard() {
  const { usuario } = useAuth();
  const [saldo, setSaldo] = useState(0);
  const [viajes, setViajes] = useState(0);
  const [loading, setLoading] = useState(true);

  const hoy = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      if (!usuario) return;
      setLoading(true);
      try {
        const pedidos = await obtenerPedidosRealizadosRepartidor(usuario.id);
        const getPedidoDate = (p: any) =>
          p.entregado_en || p.registrado_en || null;
        const start = new Date(`${hoy}T00:00:00`);
        const end = new Date(`${hoy}T23:59:59`);

        const filtrados = (pedidos || []).filter((p: any) => {
          const raw = getPedidoDate(p);
          if (!raw) return false;
          const current = new Date(raw);
          if (Number.isNaN(current.getTime())) return false;
          if (current < start) return false;
          if (current > end) return false;
          return true;
        });

        const saldoHoy = filtrados.reduce(
          (acc: number, p: any) => acc + (p.total || 0),
          0,
        );
        const viajesHoy = filtrados.length;

        if (activo) {
          setSaldo(saldoHoy);
          setViajes(viajesHoy);
        }
      } catch (error) {
        console.error("Error cargando stats del día:", error);
      } finally {
        if (activo) setLoading(false);
      }
    };
    cargar();
    return () => {
      activo = false;
    };
  }, [usuario, hoy]);

  return (
    <div className="earnings-card">
      <p style={{ marginBottom: 8 }}>Ganancias de hoy</p>
      <h2>{loading ? "HNL --" : formatHNL(saldo)}</h2>
      <div
        style={{
          display: "flex",
          gap: 20,
          marginTop: 16,
          fontSize: "0.85rem",
        }}
      >
        <span>
          <i className="fas fa-motorcycle" style={{ marginRight: 8 }}></i>
          {loading ? "--" : viajes} Viajes
        </span>
      </div>
    </div>
  );
}
