import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Componente para proteger rutas según el tipo de usuario
export function RoleProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const { usuario } = useAuth();

  if (!usuario) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(usuario.tipo_usuario)) {
    // Redireccionar a su dashboard correspondiente
    switch (usuario.tipo_usuario) {
      case "repartidor":
        return <Navigate to="/repartidor/dashboard" replace />;
      case "restaurante":
        return <Navigate to="/restaurante/dashboard" replace />;
      case "operador":
        return <Navigate to="/operador/dashboard" replace />;
      case "admin":
        return <Navigate to="/admin/dashboard" replace />;
      case "cliente":
      default:
        return <Navigate to="/home" replace />;
    }
  }

  return <>{children}</>;
}
