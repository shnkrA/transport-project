import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { DashboardPage, LoginPage, RegisterPage, TripsPage, VehiclesPage } from './pages';
import { AppLayout } from './layout';
import { AvailableTransportPage, CustomerDashboardPage, CustomerMyTripsPage, CustomerTripsPage } from './pages/customer';
import { DispatchInProgressPage, DispatchPendingPage, DispatchVehiclesPage } from './pages/dispatcher';
import { DriverTripsPage } from './pages/driver';
import { getCurrentUser } from './services/session';

function EntryRedirect() {
  const user = getCurrentUser();
  return <Navigate to={!user ? '/register' : user.role === 'dispatcher' ? '/dispatch/pending' : user.role === 'driver' ? '/driver/trips' : '/dashboard'} replace />;
}

function RoleRoute({ children, customerOnly = false, dispatcherOnly = false, driverOnly = false }: { children: JSX.Element; customerOnly?: boolean; dispatcherOnly?: boolean; driverOnly?: boolean }) {
  const user = getCurrentUser();
  if (!localStorage.getItem('accessToken') || !user) return <Navigate to="/register" replace />;
  if (customerOnly && user.role !== 'user') return <Navigate to="/dashboard" replace />;
  if (dispatcherOnly && user.role !== 'dispatcher') return <Navigate to="/dashboard" replace />;
  if (driverOnly && user.role !== 'driver') return <Navigate to="/dashboard" replace />;
  if (user.role === 'driver' && !driverOnly) return <Navigate to="/driver/trips" replace />;
  if (user.role === 'dispatcher' && !dispatcherOnly) return <Navigate to="/dispatch/pending" replace />;
  if (!customerOnly && user.role === 'user') return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<AppLayout><Outlet /></AppLayout>}>
        <Route path="/dashboard" element={getCurrentUser()?.role === 'dispatcher' ? <Navigate to="/dispatch/pending" replace /> : getCurrentUser()?.role === 'user' ? <RoleRoute customerOnly><CustomerDashboardPage /></RoleRoute> : <RoleRoute><DashboardPage /></RoleRoute>} />
        <Route path="/trips" element={getCurrentUser()?.role === 'dispatcher' ? <Navigate to="/dispatch/pending" replace /> : getCurrentUser()?.role === 'user' ? <RoleRoute customerOnly><CustomerTripsPage /></RoleRoute> : <RoleRoute><TripsPage /></RoleRoute>} />
        <Route path="/my-trips" element={<RoleRoute customerOnly><CustomerMyTripsPage /></RoleRoute>} />
        <Route path="/vehicles" element={<RoleRoute><VehiclesPage /></RoleRoute>} />
        <Route path="/available-transport" element={<RoleRoute customerOnly><AvailableTransportPage /></RoleRoute>} />
        <Route path="/dispatch/pending" element={<RoleRoute dispatcherOnly><DispatchPendingPage /></RoleRoute>} />
        <Route path="/dispatch/in-progress" element={<RoleRoute dispatcherOnly><DispatchInProgressPage /></RoleRoute>} />
        <Route path="/dispatch/vehicles" element={<RoleRoute dispatcherOnly><DispatchVehiclesPage /></RoleRoute>} />
        <Route path="/driver/trips" element={<RoleRoute driverOnly><DriverTripsPage /></RoleRoute>} />
        <Route path="/calculate" element={<Navigate to="/trips?create=1" replace />} />
      </Route>
      <Route path="/" element={<EntryRedirect />} />
      <Route path="*" element={<EntryRedirect />} />
    </Routes>
  );
}

export default App;
