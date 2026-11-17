import { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const navigation = [
  { label: 'Огляд', path: '/dashboard', icon: '◫' },
  { label: 'Замовлення', path: '/orders', icon: '▤' },
  { label: 'Рейси', path: '/trips', icon: '↗' },
  { label: 'Автопарк', path: '/vehicles', icon: '▰' },
  { label: 'Водії', path: '/drivers', icon: '♙' },
  { label: 'Техобслуговування', path: '/maintenance', icon: '⚙' },
  { label: 'Аналітика', path: '/analytics', icon: '▥' },
];

const titles: Record<string, string> = {
  '/dashboard': 'Огляд',
  '/orders': 'Замовлення',
  '/trips': 'Рейси',
  '/vehicles': 'Автопарк',
  '/drivers': 'Водії',
  '/maintenance': 'Техобслуговування',
  '/analytics': 'Аналітика',
};

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const title = titles[location.pathname] ?? 'Огляд';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink className="brand" to="/dashboard" aria-label="На головну">
          <span className="brand-mark">Т</span>
          <span><strong>ТРАНЗИТ</strong><small>СИСТЕМА КЕРУВАННЯ</small></span>
        </NavLink>
        <div className="side-label">РОБОЧИЙ ПРОСТІР</div>
        <nav className="side-nav" aria-label="Головна навігація">
          {navigation.map((item) => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
              {item.path === '/maintenance' && <i className="nav-count">2</i>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><span className="help-dot" /><div><strong>Усе під контролем</strong><small>Система працює нормально</small></div></div>
          <div className="user-card"><div className="avatar">АП</div><div className="user-info"><strong>Анна Шинкарь</strong><small>Адміністратор</small></div></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="crumb"><span>Транспортне підприємство</span><b>/</b><strong>{title}</strong></div>
          <div className="top-actions">
            <div className="top-avatar">АП</div>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
