import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage, DashboardPage, OrdersPage, TripsPage, VehiclesPage, DriversPage, MaintenancePage, AnalyticsPage } from './pages';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/trips" element={<TripsPage />} />
      <Route path="/vehicles" element={<VehiclesPage />} />
      <Route path="/drivers" element={<DriversPage />} />
      <Route path="/maintenance" element={<MaintenancePage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
