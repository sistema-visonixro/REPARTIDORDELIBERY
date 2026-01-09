import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "linear-gradient(135deg, #2e1065, #1e1b4b)",
          padding: "12px 14px 14px", // menos alto
          boxShadow: "0 2px 8px rgba(30, 27, 75, 0.18)",
          clipPath: "ellipse(100% 75% at 50% 10%)", // curva más sutil
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            maxWidth: "500px",
            margin: "0 auto",
          }}
        >
          {/* Logo + Título */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <img
              src="/logo.png"
              alt="Delibery"
              style={{ height: 36, borderRadius: "10px" }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                lineHeight: 1.1,
              }}
            >
              <div style={{ color: "#fff", fontWeight: 900, fontSize: 16 }}>
                Food Delibery Roatan
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.9)",
                  marginTop: 2,
                }}
              >
                Tu comida, más cerca
              </div>
            </div>
          </div>

          {/* Menu Icon - estilo más moderno */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: "rgba(168, 85, 247, 0.22)",
              border: "none",
              borderRadius: "12px",
              padding: "8px 10px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              transition: "all 0.3s ease",
              boxShadow: menuOpen
                ? "0 0 12px rgba(168, 85, 247, 0.28)"
                : "0 2px 6px rgba(0,0,0,0.12)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.05)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <div
              style={{
                width: "20px",
                height: "3px",
                background: "#e9a1ff",
                borderRadius: "3px",
              }}
            />
            <div
              style={{
                width: "20px",
                height: "3px",
                background: "#e9a1ff",
                borderRadius: "3px",
              }}
            />
            <div
              style={{
                width: "20px",
                height: "3px",
                background: "#e9a1ff",
                borderRadius: "3px",
              }}
            />
          </button>
        </div>
      </header>

      {/* Dropdown Menu con Glassmorphism */}
      {menuOpen && (
        <>
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 150,
            }}
          />

          <div
            style={{
              position: "fixed",
              top: "80px",
              right: "20px",
              background: "rgba(255, 255, 255, 0.15)", // Glass effect
              borderRadius: "24px",
              boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
              padding: "12px",
              zIndex: 200,
              minWidth: "220px",
              border: "1px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(16px)", // Glassmorphism blur
              WebkitBackdropFilter: "blur(16px)", // Safari support
            }}
          >
            <button
              onClick={() => setMenuOpen(false)}
              style={{
                width: "100%",
                padding: "16px 18px",
                background: "transparent",
                border: "none",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                cursor: "pointer",
                fontSize: "16px",
                color: "#fff",
                fontWeight: 500,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span style={{ fontSize: "24px" }}>👤</span>
              Mi Cuenta
            </button>

            <button
              onClick={() => setMenuOpen(false)}
              style={{
                width: "100%",
                padding: "16px 18px",
                background: "transparent",
                border: "none",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                cursor: "pointer",
                fontSize: "16px",
                color: "#fff",
                fontWeight: 500,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span style={{ fontSize: "24px" }}>📦</span>
              Mis Pedidos
            </button>

            <div
              style={{
                height: "1px",
                background: "rgba(255,255,255,0.2)",
                margin: "10px 0",
              }}
            />

            <button
              onClick={() => {
                handleLogout();
                setMenuOpen(false);
              }}
              style={{
                width: "100%",
                padding: "16px 18px",
                background: "transparent",
                border: "none",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                cursor: "pointer",
                fontSize: "16px",
                color: "#ff6b6b",
                fontWeight: 500,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,107,107,0.1)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span style={{ fontSize: "24px" }}>🚪</span>
              Cerrar Sesión
            </button>
          </div>
        </>
      )}
    </>
  );
}
