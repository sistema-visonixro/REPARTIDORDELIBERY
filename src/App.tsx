import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { RoleProtectedRoute } from "./components/RoleProtectedRoute";
import Login from "./pages/Login";
import DashboardRepartidor from "./pages/repartidor/DashboardRepartidor";
import PedidosView from "./pages/repartidor/PedidosView";
import Cartera from "./pages/repartidor/Cartera";
import Avisos from "./pages/repartidor/Avisos";
import Cuenta from "./pages/repartidor/Cuenta";
import MobileNav from "./pages/repartidor/MobileNav";
import LocationTracker from "./components/LocationTracker";
import RepartidorRuta from "./pages/repartidor/RepartidorRuta";

import "./App.css";

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();
  if (!usuario) return <>{children}</>;
  if (usuario.tipo_usuario === "repartidor")
    return <Navigate to="/repartidor/dashboard" replace />;
  return <Navigate to="/home" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Route /home removed to simplify build */}

      <Route
        path="/repartidor/dashboard"
        element={
          <RoleProtectedRoute allowedRoles={["repartidor"]}>
            <DashboardRepartidor />
          </RoleProtectedRoute>
        }
      />

      <Route
        path="/repartidor/pedidos"
        element={
          <RoleProtectedRoute allowedRoles={["repartidor"]}>
            <PedidosView />
          </RoleProtectedRoute>
        }
      />

      <Route
        path="/repartidor/cartera"
        element={
          <RoleProtectedRoute allowedRoles={["repartidor"]}>
            <Cartera />
          </RoleProtectedRoute>
        }
      />

      <Route
        path="/repartidor/avisos"
        element={
          <RoleProtectedRoute allowedRoles={["repartidor"]}>
            <Avisos />
          </RoleProtectedRoute>
        }
      />

      <Route
        path="/repartidor/cuenta"
        element={
          <RoleProtectedRoute allowedRoles={["repartidor"]}>
            <Cuenta />
          </RoleProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
      <Route
        path="/repartidor/ruta/:id"
        element={
          <RoleProtectedRoute allowedRoles={["repartidor"]}>
            <RepartidorRuta />
          </RoleProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <LocationTracker />
          <MobileNav />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
