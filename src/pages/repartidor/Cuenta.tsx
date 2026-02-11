import "./driver.css";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  actualizarPerfilRepartidor,
  obtenerPerfilRepartidor,
  obtenerPedidosRealizadosRepartidor,
} from "../../services/repartidor.service";
import type { Repartidor } from "../../types/repartidor.types";
import { formatHNL } from "../../lib/currency";

export default function Cuenta() {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<Repartidor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stats
  const [totalEntregas, setTotalEntregas] = useState(0);
  const [totalGanancias, setTotalGanancias] = useState(0);

  // Form fields
  const [tipoVehiculo, setTipoVehiculo] =
    useState<Repartidor["tipo_vehiculo"]>(null);
  const [placaVehiculo, setPlacaVehiculo] = useState("");
  const [disponible, setDisponible] = useState(false);
  const [clave, setClave] = useState("");

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      if (!usuario) return;
      setLoading(true);
      try {
        const data = await obtenerPerfilRepartidor(usuario.id);
        if (!activo) return;
        setPerfil(data);
        setTipoVehiculo(data.tipo_vehiculo || null);
        setPlacaVehiculo(data.placa_vehiculo || "");
        setDisponible(Boolean(data.disponible));
        setClave(data.clave || "");

        // Load stats
        try {
          const pedidos = await obtenerPedidosRealizadosRepartidor(usuario.id);
          if (activo) {
            setTotalEntregas(pedidos.length);
            const total = pedidos.reduce(
              (acc: number, p: any) => acc + (p.total || 0),
              0,
            );
            setTotalGanancias(total);
          }
        } catch (err) {
          console.error("Error loading stats:", err);
        }
      } catch (err) {
        console.error("Error cargando perfil:", err);
        if (activo) setError("No se pudo cargar el perfil");
      } finally {
        if (activo) setLoading(false);
      }
    };
    cargar();
    return () => {
      activo = false;
    };
  }, [usuario]);

  const guardar = async () => {
    if (!perfil) return;
    setSaving(true);
    try {
      const actualizado = await actualizarPerfilRepartidor(perfil.id, {
        tipo_vehiculo: tipoVehiculo,
        placa_vehiculo: placaVehiculo || null,
        disponible,
        clave: clave || null,
      });
      setPerfil(actualizado as Repartidor);
      alert("✅ Datos actualizados correctamente");
    } catch (err) {
      console.error("Error actualizando perfil:", err);
      alert("❌ No se pudo actualizar el perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (confirm("¿Estás seguro que deseas cerrar sesión?")) {
      cerrarSesion();
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="account-page">
        <div className="account-loading">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="account-page">
        <div className="account-loading">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const initials = (perfil?.nombre_completo || usuario?.nombre || "?")
    .charAt(0)
    .toUpperCase();

  return (
    <div className="account-page">
      {/* Profile Header */}
      <div className="account-profile-header">
        <div className="account-profile-content">
          <div className="account-avatar-large">{initials}</div>
          <h1 className="account-profile-name">
            {perfil?.nombre_completo || usuario?.nombre || "Usuario"}
          </h1>
          <p className="account-profile-role">Repartidor</p>
          {perfil?.telefono && (
            <p className="account-profile-phone">
              <i className="fas fa-phone"></i>
              {perfil.telefono}
            </p>
          )}
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="account-stats-grid">
        <div className="account-stat-card">
          <div className="account-stat-icon">
            <i className="fas fa-box"></i>
          </div>
          <p className="account-stat-label">Total Entregas</p>
          <h3 className="account-stat-value">{totalEntregas}</h3>
        </div>

        <div className="account-stat-card">
          <div className="account-stat-icon">
            <i className="fas fa-dollar-sign"></i>
          </div>
          <p className="account-stat-label">Ganancias</p>
          <h3 className="account-stat-value">{formatHNL(totalGanancias)}</h3>
        </div>

        <div className="account-stat-card">
          <div className="account-stat-icon">
            <i className="fas fa-star"></i>
          </div>
          <p className="account-stat-label">Calificación</p>
          <h3 className="account-stat-value">4.95</h3>
        </div>

        <div className="account-stat-card">
          <div className="account-stat-icon">
            <i
              className={
                disponible ? "fas fa-check-circle" : "fas fa-times-circle"
              }
            ></i>
          </div>
          <p className="account-stat-label">Estado</p>
          <h3 className="account-stat-value" style={{ fontSize: "1.1rem" }}>
            {disponible ? "Activo" : "Inactivo"}
          </h3>
        </div>
      </div>

      {/* Vehicle & Availability Settings */}
      <div className="account-section">
        <h3 className="account-section-title">
          <i className="fas fa-motorcycle"></i>
          Vehículo y Disponibilidad
        </h3>
        <form
          className="account-form"
          onSubmit={(e) => {
            e.preventDefault();
            guardar();
          }}
        >
          <div className="account-form-group">
            <label className="account-form-label">
              <i className="fas fa-car"></i>
              Tipo de vehículo
            </label>
            <select
              value={tipoVehiculo || ""}
              onChange={(e) =>
                setTipoVehiculo(e.target.value as Repartidor["tipo_vehiculo"])
              }
            >
              <option value="">Selecciona un tipo</option>
              <option value="moto">🏍️ Moto</option>
              <option value="bicicleta">🚴 Bicicleta</option>
              <option value="auto">🚗 Auto</option>
              <option value="a_pie">🚶 A pie</option>
            </select>
          </div>

          <div className="account-form-group">
            <label className="account-form-label">
              <i className="fas fa-id-card"></i>
              Placa del vehículo
            </label>
            <input
              type="text"
              value={placaVehiculo}
              onChange={(e) => setPlacaVehiculo(e.target.value)}
              placeholder="Ej. HAA-1234"
            />
          </div>

          <div className="account-form-group">
            <label className="account-form-label">
              <i className="fas fa-toggle-on"></i>
              Disponibilidad
            </label>
            <select
              value={disponible ? "si" : "no"}
              onChange={(e) => setDisponible(e.target.value === "si")}
            >
              <option value="si">✅ Disponible</option>
              <option value="no">❌ No disponible</option>
            </select>
          </div>

          <div className="account-form-group">
            <label className="account-form-label">
              <i className="fas fa-key"></i>
              Clave de acceso
            </label>
            <input
              type="text"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              placeholder="Tu clave personal"
            />
          </div>

          <button className="account-btn-save" type="submit" disabled={saving}>
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Guardando...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i> Guardar cambios
              </>
            )}
          </button>
        </form>
      </div>

      {/* Logout Section */}
      <div className="account-section">
        <h3 className="account-section-title">
          <i className="fas fa-sign-out-alt"></i>
          Sesión
        </h3>
        <button
          className="account-btn-logout"
          type="button"
          onClick={handleLogout}
        >
          <i className="fas fa-sign-out-alt"></i>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
