import { ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, getRoleLabel, getUserInitials } from './services/session';

const staffNavigation = [
  { label: 'Огляд', path: '/dashboard', icon: '◫' },
  { label: 'Рейси', path: '/trips', icon: '↗' },
  { label: 'Автопарк', path: '/vehicles', icon: '▰' },
];

const titles: Record<string, string> = {
  '/dashboard': 'Огляд',
  '/trips': 'Рейси',
  '/vehicles': 'Автопарк',
};
const customerNavigation = [
  { label: 'Огляд', path: '/dashboard', icon: '◫' },
  { label: 'Доступний транспорт', path: '/available-transport', icon: '▰' },
  { label: 'Рейси', path: '/trips', icon: '↗' },
  { label: 'Мої рейси', path: '/my-trips', icon: '▤' },
];
const customerTitles: Record<string, string> = {
  '/dashboard': 'Огляд',
  '/available-transport': 'Доступний транспорт',
  '/trips': 'Рейси',
  '/my-trips': 'Мої рейси',
};
const dispatcherNavigation = [
  { label: 'Рейси на підтвердження', path: '/dispatch/pending', icon: '✓' },
  { label: 'Рейси у дорозі', path: '/dispatch/in-progress', icon: '↗' },
  { label: 'Транспорт і ТО', path: '/dispatch/vehicles', icon: '⚙' },
];
const dispatcherTitles: Record<string, string> = {
  '/dispatch/pending': 'Рейси на підтвердження',
  '/dispatch/in-progress': 'Рейси у дорозі',
  '/dispatch/vehicles': 'Транспорт і ТО',
};
const driverNavigation = [{ label: 'Мої рейси', path: '/driver/trips', icon: '↗' }];
const driverTitles: Record<string, string> = { '/driver/trips': 'Мої рейси' };
const mechanicNavigation = [{ label: 'Транспорт і ремонти', path: '/mechanic/vehicles', icon: '⚙' }];
const mechanicTitles: Record<string, string> = { '/mechanic/vehicles': 'Транспорт і ремонти' };

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const isCustomer = currentUser?.role === 'user';
  const isDispatcher = currentUser?.role === 'dispatcher';
  const isDriver = currentUser?.role === 'driver';
  const isMechanic = currentUser?.role === 'mechanic';
  const title = (isCustomer ? customerTitles : isDispatcher ? dispatcherTitles : isDriver ? driverTitles : isMechanic ? mechanicTitles : titles)[location.pathname] ?? 'Огляд';
  const navigation = isCustomer ? customerNavigation : isDispatcher ? dispatcherNavigation : isDriver ? driverNavigation : isMechanic ? mechanicNavigation : staffNavigation;

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUser');
    navigate('/register');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink className="brand" to="/dashboard" aria-label="На головну">
          <span className="brand-mark">Т</span>
          <span><strong>ТРАНЗИТ</strong></span>
        </NavLink>
        <nav className="side-nav" aria-label="Головна навігація">
          {navigation.map((item) => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-card"><div className="avatar">{getUserInitials(currentUser)}</div><div className="user-info"><strong>{currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Користувач'}</strong><small>{getRoleLabel(currentUser?.role)}</small></div><button className="logout-button" type="button" onClick={logout}>Вийти</button></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <strong className="topbar-title">{title}</strong>
          <div className="top-actions">
            <div className="top-avatar">{getUserInitials(currentUser)}</div>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
