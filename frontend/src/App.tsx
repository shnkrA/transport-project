import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { DashboardPage, LoginPage, RegisterPage, TripsPage, VehiclesPage } from './pages';
import { AppLayout } from './layout';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<AppLayout><Outlet /></AppLayout>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/vehicles" element={<VehiclesPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/register" replace />} />
      <Route path="*" element={<Navigate to="/register" replace />} />
    </Routes>
  );
}

export default App;
