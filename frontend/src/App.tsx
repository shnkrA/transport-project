import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import {
  AnalyticsPage,
  DashboardPage,
  DriversPage,
  LoginPage,
  MaintenancePage,
  OrdersPage,
  TripsPage,
  VehiclesPage,
} from './pages';
import { AppLayout } from './layout';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppLayout><Outlet /></AppLayout>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/drivers" element={<DriversPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
