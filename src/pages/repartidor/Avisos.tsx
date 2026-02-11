import "./driver.css";
import { useEffect, useMemo, useState } from "react";
import { obtenerAvisos } from "../../services/repartidor.service";
import type { Aviso } from "../../types/repartidor.types";

export default function Avisos() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      setLoading(true);
      try {
        const data = await obtenerAvisos();
        if (activo) setAvisos(data);
      } catch (err) {
        console.error("Error cargando avisos:", err);
        if (activo) setError("No se pudieron cargar los avisos");
      } finally {
        if (activo) setLoading(false);
      }
    };
    cargar();
    return () => {
      activo = false;
    };
  }, []);

  const visibles = useMemo(() => {
    const now = new Date();
    return avisos.filter((aviso) => {
      const inicio = aviso.fecha_inicio ? new Date(aviso.fecha_inicio) : null;
      const fin = aviso.fecha_fin ? new Date(aviso.fecha_fin) : null;
      if (inicio && now < inicio) return false;
      if (fin && now > fin) return false;
      return true;
    });
  }, [avisos]);

  return (
    <div className="avisos-page">
      <div className="avisos-hero">
        <div>
          <h2>Avisos</h2>
          <p>Comunicados del administrador para el repartidor.</p>
        </div>
        <div className="avisos-count">{visibles.length} activos</div>
      </div>

      {loading && <div className="avisos-empty">Cargando avisos...</div>}
      {error && <div className="avisos-empty">{error}</div>}
      {!loading && !error && visibles.length === 0 && (
        <div className="avisos-empty">No hay avisos nuevos.</div>
      )}

      <div className="avisos-grid">
        {!loading &&
          !error &&
          visibles.map((aviso) => (
            <div key={aviso.id} className={`aviso-card ${aviso.prioridad}`}>
              <div className="aviso-header">
                <span className="aviso-badge">{aviso.prioridad}</span>
                <small>{new Date(aviso.creado_en).toLocaleString()}</small>
              </div>
              <h3>{aviso.titulo}</h3>
              <p>{aviso.mensaje}</p>
              {(aviso.fecha_inicio || aviso.fecha_fin) && (
                <div className="aviso-dates">
                  {aviso.fecha_inicio && (
                    <span>
                      Inicio:{" "}
                      {new Date(aviso.fecha_inicio).toLocaleDateString()}
                    </span>
                  )}
                  {aviso.fecha_fin && (
                    <span>
                      Fin: {new Date(aviso.fecha_fin).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
