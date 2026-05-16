import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import VentasPage from './pages/VentasPage';
import MovimientosPage from './pages/MovimientosPage';
import ProductosPage from './pages/ProductosPage';
import ReportesPage from './pages/ReportesPage';
import TiendasPage from './pages/TiendasPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import AnalisisDetalladoPage from './pages/AnalisisDetalladoPage';
import RegistroTendederoPage from './pages/RegistroTendederoPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import ProveedoresPage from './pages/ProveedoresPage';
import AlertasPage from './pages/AlertasPage';
import AuditoriaPage from './pages/AuditoriaPage';
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage';
import SimuladorPage from './pages/SimuladorPage';
import AprendizajePage from './pages/AprendizajePage';
import ForcePasswordPage from './pages/ForcePasswordPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SidebarProvider } from './context/SidebarContext';

// Rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.cambioClaveForzoso) {
    return <Navigate to="/activacion-cuenta" replace />;
  }
  return children;
};

// Rutas públicas (redirigen al dashboard si ya hay sesión)
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    if (user.cambioClaveForzoso) {
      return <Navigate to="/activacion-cuenta" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Rutas exclusivas para Administrador
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user || user.rol !== 'Administrador') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Ruta especial para el flujo forzado
const ForceChangeRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!user.cambioClaveForzoso) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <ToastProvider>
    <AuthProvider>
      <SidebarProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />
          
          <Route path="/forgot-password" element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          } />

          <Route path="/register" element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } />

          {/* Redirigir la raíz a la Landing Page (es pública, pero si hay sesión irá al Dashboard) */}
          <Route path="/" element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          } />

          {/* Ruta Especial: Activación de Cuenta Obligatoria */}
          <Route path="/activacion-cuenta" element={
            <ForceChangeRoute>
              <ForcePasswordPage />
            </ForceChangeRoute>
          } />
          
          {/* Rutas Privadas con Layout del Dashboard */}
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/ventas" element={<VentasPage />} />
            <Route path="/productos" element={<ProductosPage />} />
            <Route path="/alertas" element={<AlertasPage />} />
            <Route path="/tiendas" element={<TiendasPage />} />
            <Route path="/perfil" element={<ProfilePage />} />
            {/* Rutas exclusivas de Administrador */}
            <Route path="/movimientos" element={<AdminRoute><MovimientosPage /></AdminRoute>} />
            <Route path="/proveedores" element={<AdminRoute><ProveedoresPage /></AdminRoute>} />
            <Route path="/analitica-visual" element={<AdminRoute><AnalyticsDashboardPage /></AdminRoute>} />
            <Route path="/analisis-detallado" element={<AdminRoute><AnalisisDetalladoPage /></AdminRoute>} />
            <Route path="/simulador" element={<AdminRoute><SimuladorPage /></AdminRoute>} />
            <Route path="/reportes" element={<AdminRoute><ReportesPage /></AdminRoute>} />
            <Route path="/auditoria" element={<AdminRoute><AuditoriaPage /></AdminRoute>} />
            <Route path="/aprendizaje" element={<AdminRoute><AprendizajePage /></AdminRoute>} />
            <Route path="/registro-tendedero" element={<AdminRoute><RegistroTendederoPage /></AdminRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
      </SidebarProvider>
    </AuthProvider>
    </ToastProvider>
  );
}

export default App;
