import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { loginRepartidor } from "../lib/supabase";

export default function Login() {
  const [codigo, setCodigo] = useState("");
  const [clave, setClave] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setUsuario } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const usuario = await loginRepartidor(codigo, clave);
      if (usuario) {
        setUsuario(usuario);

        // Redireccionar según el tipo de usuario
        switch (usuario.tipo_usuario) {
          case "repartidor":
            navigate("/repartidor/dashboard");
            break;
          case "restaurante":
            navigate("/restaurante/dashboard");
            break;
          case "operador":
            navigate("/operador/dashboard");
            break;
          case "admin":
            navigate("/admin/dashboard");
            break;
          case "cliente":
          default:
            navigate("/home");
            break;
        }
      } else {
        setError("Código o clave incorrectos");
      }
    } catch (err) {
      setError("Error al iniciar sesión. Intenta nuevamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: isDark
          ? "linear-gradient(135deg, #0a0118 0%, #1a0b2e 50%, #0f0a1f 100%)"
          : "linear-gradient(135deg, #faf5ff 0%, #fce7f3 50%, #eef2ff 100%)",
        padding: "16px",
        transition: "background 0.5s ease",
      }}
    >
      {/* Animated Background Circles (reduced sizes for mobile) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
          opacity: 0.6,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "28%",
            left: "20%",
            width: "180px",
            height: "180px",
            background: isDark
              ? "radial-gradient(circle, rgba(168,85,247,0.28) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(192,132,252,0.2) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(48px)",
            animation: "pulse 4s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "22%",
            right: "18%",
            width: "200px",
            height: "200px",
            background: isDark
              ? "radial-gradient(circle, rgba(236,72,153,0.28) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(251,207,232,0.28) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(52px)",
            animation: "pulse 5s ease-in-out infinite",
            animationDelay: "1s",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "52%",
            width: "160px",
            height: "160px",
            background: isDark
              ? "radial-gradient(circle, rgba(99,102,241,0.28) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(165,180,252,0.22) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(50px)",
            animation: "pulse 6s ease-in-out infinite",
            animationDelay: "2s",
          }}
        />
      </div>

      {/* Main Login Card */}
      <main
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "360px",
          zIndex: 10,
          animation: "fadeInUp 0.5s ease-out",
        }}
      >
        <div
          style={{
            position: "relative",
            background: isDark
              ? "rgba(31,18,48,0.92)"
              : "rgba(255,255,255,0.92)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderRadius: "20px",
            boxShadow: isDark
              ? "0 18px 50px rgba(168,85,247,0.22), 0 0 0 1px rgba(167,139,250,0.08)"
              : "0 14px 40px rgba(0,0,0,0.10), 0 0 0 1px rgba(192,132,252,0.12)",
            border: isDark
              ? "1px solid rgba(139,92,246,0.15)"
              : "1px solid rgba(192,132,252,0.18)",
            padding: "32px 24px",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = isDark
              ? "0 30px 80px rgba(168,85,247,0.35), 0 0 0 1px rgba(167,139,250,0.15)"
              : "0 25px 70px rgba(0,0,0,0.15), 0 0 0 1px rgba(192,132,252,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = isDark
              ? "0 25px 70px rgba(168,85,247,0.25), 0 0 0 1px rgba(167,139,250,0.1)"
              : "0 20px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(192,132,252,0.15)";
          }}
        >
          {/* Logo and Title */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "32px",
              animation: "slideInLeft 0.5s ease-out",
            }}
          >
            <div style={{ position: "relative", width: 64, height: 64 }}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(135deg, #19181a 0%, #ec4899 100%)",
                  borderRadius: "16px",
                  filter: "blur(12px)",
                  opacity: 0.7,
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <img
                src="/logo.png"
                alt="Delibery"
                style={{
                  width: "120px",
                  height: "auto",
                  objectFit: "contain",
                  transition: "transform 0.25s ease",
                  display: "block",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.03) rotate(1deg)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1) rotate(0deg)")
                }
              />
              <p
                style={{
                  fontSize: "14px",
                  color: isDark ? "#d1d5db" : "#6b7280",
                  margin: "6px 0 0 0",
                  fontWeight: 500,
                }}
              >
                
              </p>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            {/* Error Message */}
            {error && (
              <div
                style={{
                  background: isDark ? "rgba(127,29,29,0.4)" : "#fef2f2",
                  border: `1px solid ${isDark ? "#991b1b" : "#fecaca"}`,
                  color: isDark ? "#fca5a5" : "#dc2626",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  animation: "shake 0.5s ease-in-out",
                }}
              >
                <span style={{ fontSize: "18px" }}>⚠️</span>
                {error}
              </div>
            )}

            {/* Email Input */}
            <div style={{ animation: "slideInRight 0.6s ease-out" }}>
              <label
                htmlFor="codigo"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: isDark ? "#e5e7eb" : "#374151",
                  marginBottom: "6px",
                }}
              >
               Codigo de Driver
              </label>
              <input
                id="codigo"
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Código de repartidor"
                required
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: `2px solid ${isDark ? "#6b21a8" : "#e9d5ff"}`,
                  background: isDark
                    ? "rgba(88,28,135,0.18)"
                    : "rgba(255,255,255,0.64)",
                  color: isDark ? "#ffffff" : "#111827",
                  fontSize: "14px",
                  outline: "none",
                  transition: "all 0.2s ease",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = isDark
                    ? "#a855f7"
                    : "#9333ea";
                  e.currentTarget.style.boxShadow = isDark
                    ? "0 0 0 4px rgba(168,85,247,0.15)"
                    : "0 0 0 4px rgba(147,51,234,0.1)";
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = isDark
                    ? "#6b21a8"
                    : "#e9d5ff";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              />
            </div>

            {/* Password Input */}
            <div style={{ animation: "slideInRight 0.7s ease-out" }}>
              <label
                htmlFor="clave"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: isDark ? "#e5e7eb" : "#374151",
                  marginBottom: "6px",
                }}
              >
                Clave
              </label>
              <input
                id="clave"
                type="password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                placeholder="Clave"
                required
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: `2px solid ${isDark ? "#6b21a8" : "#e9d5ff"}`,
                  background: isDark
                    ? "rgba(88,28,135,0.18)"
                    : "rgba(255,255,255,0.64)",
                  color: isDark ? "#ffffff" : "#111827",
                  fontSize: "14px",
                  outline: "none",
                  transition: "all 0.2s ease",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = isDark
                    ? "#a855f7"
                    : "#9333ea";
                  e.currentTarget.style.boxShadow = isDark
                    ? "0 0 0 4px rgba(168,85,247,0.15)"
                    : "0 0 0 4px rgba(147,51,234,0.1)";
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = isDark
                    ? "#6b21a8"
                    : "#e9d5ff";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px 18px",
                borderRadius: "10px",
                background: isDark
                  ? "linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #6366f1 100%)"
                  : "linear-gradient(135deg, #9333ea 0%, #db2777 50%, #4f46e5 100%)",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 700,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                boxShadow: isDark
                  ? "0 10px 30px rgba(168,85,247,0.28)"
                  : "0 8px 24px rgba(147,51,234,0.26)",
                transition: "all 0.2s ease",
                opacity: loading ? 0.8 : 1,
                animation: "slideInUp 0.6s ease-out",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform =
                    "scale(1.02) translateY(-2px)";
                  e.currentTarget.style.boxShadow = isDark
                    ? "0 16px 45px rgba(168,85,247,0.45)"
                    : "0 14px 40px rgba(147,51,234,0.4)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1) translateY(0)";
                e.currentTarget.style.boxShadow = isDark
                  ? "0 12px 35px rgba(168,85,247,0.35)"
                  : "0 10px 30px rgba(147,51,234,0.3)";
              }}
              onMouseDown={(e) =>
                !loading &&
                (e.currentTarget.style.transform = "scale(0.98) translateY(0)")
              }
              onMouseUp={(e) =>
                !loading &&
                (e.currentTarget.style.transform =
                  "scale(1.02) translateY(-2px)")
              }
            >
              {loading ? (
                <>
                  <svg
                    style={{
                      width: "20px",
                      height: "20px",
                      animation: "spin 1s linear infinite",
                    }}
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      style={{ opacity: 0.25 }}
                    />
                    <path
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      style={{ opacity: 0.75 }}
                    />
                  </svg>
                  <span>Iniciando...</span>
                </>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <span
                    style={{
                      fontSize: "20px",
                      transition: "transform 0.3s ease",
                    }}
                  >
                    →
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
      </main>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
