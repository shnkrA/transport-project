import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getCurrentUser } from '../services/session';

type SectionKey = 'trips' | 'vehicles';
type Overview = {
  counts: { tripsToday: number; tripsInProgress: number; availableVehicles: number; vehiclesNeedingAttention: number };
  fleet: { total: number; inTrip: number; available: number; maintenance: number; outOfService: number };
  recentTrips: Array<{ id: number; departurePoint: string; arrivalPoint: string; departureTime?: string; status: string; driverFirstName?: string; driverLastName?: string; vehicleType?: string; vehicleModel?: string }>;
  activity: Array<{ date: string; completed: number; scheduled: number }>;
};

const tripStatusLabels: Record<string, string> = { pending: 'Очікує підтвердження', confirmed: 'Підтверджено', in_progress: 'У дорозі', completed: 'Завершено', cancelled: 'Скасовано' };
const vehicleStatusLabels: Record<string, string> = { available: 'Доступний', in_trip: 'У дорозі', maintenance: 'На ТО', out_of_service: 'Не експлуатується' };

function Badge({ value }: { value: string }) {
  const tone = /рейс|маршрут|роботі/i.test(value) ? 'blue' : /план|розгляд|то/i.test(value) ? 'amber' : /готов|підтвердж|викон|доступ/i.test(value) ? 'green' : 'red';
  return <span className={`status-pill ${tone}`}><i />{value}</span>;
}

function SectionPage({ section }: { section: SectionKey }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get(section === 'trips' ? '/trips' : '/vehicles')
      .then(({ data }) => setRows(data))
      .catch((reason) => setError(reason?.response?.data?.message ?? 'Не вдалося завантажити дані.'))
      .finally(() => setLoading(false));
  }, [section]);
  const trips = section === 'trips';
  return <>
    <div className="page-heading"><div><h1>{trips ? 'Рейси' : 'Автопарк'}</h1></div></div>
    {error && <div className="customer-alert danger">{error}</div>}
    <section className="panel table-panel"><div className="panel-heading"><div><h2>{trips ? 'Усі рейси' : 'Увесь транспорт'}</h2><span>{rows.length} записів</span></div></div>
      {loading ? <div className="customer-empty">Завантаження…</div> : rows.length === 0 ? <div className="customer-empty">Немає записів.</div> : <div className="table-wrap"><table><thead><tr>{trips ? <><th>РЕЙС</th><th>МАРШРУТ</th><th>ВОДІЙ</th><th>ТРАНСПОРТ</th><th>ВИЇЗД</th><th>СТАТУС</th></> : <><th>ТРАНСПОРТ</th><th>НОМЕР</th><th>ТИП</th><th>МІСЦЬ</th><th>СТАН</th></>}</tr></thead><tbody>{rows.map((row) => trips
        ? <tr key={row.id}><td><strong className="trip-id">#{row.id}</strong></td><td>{row.departurePoint} <i className="route-arrow">→</i> {row.arrivalPoint}</td><td>{row.driverFirstName ? `${row.driverFirstName} ${row.driverLastName ?? ''}` : 'Не призначено'}</td><td>{row.vehicleType === 'train' ? 'Потяг' : row.vehicleModel ?? '—'}</td><td>{row.departureTime ? new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(row.departureTime)) : 'Не вказано'}</td><td><Badge value={tripStatusLabels[row.status] ?? row.status} /></td></tr>
        : <tr key={row.id}><td>{row.model}</td><td>{row.licensePlate}</td><td>{row.vehicleType === 'train' ? 'Потяг' : row.vehicleType === 'bus' ? 'Автобус' : row.vehicleType}</td><td>{row.capacitySeats ?? '—'}</td><td><Badge value={vehicleStatusLabels[row.status] ?? row.status} /></td></tr>)}</tbody></table></div>}
      {!loading && rows.length > 0 && <div className="table-footer">Показано {rows.length} записів</div>}
    </section>
  </>;
}

function Metric({ title, value, note, icon, tone }: { title: string; value: string; note: string; icon: string; tone: string }) {
  return <article className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><div className="metric-label">{title}</div><div className="metric-value">{value}</div><div className="metric-foot">{note}</div></article>;
}

export function DashboardPage() {
  const currentUser = getCurrentUser();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get<Overview>('/trips/overview')
      .then(({ data }) => setOverview(data))
      .catch((reason) => setError(reason?.response?.data?.message ?? 'Не вдалося завантажити огляд.'));
  }, []);
  const today = new Intl.DateTimeFormat('uk-UA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date()).toLocaleUpperCase('uk-UA');
  if (!overview) return <><div className="page-heading dashboard-heading"><div><div className="eyebrow">{today}</div><h1>Доброго дня, {currentUser?.firstName ?? 'користувачу'}</h1></div></div>{error ? <div className="customer-alert danger">{error}</div> : <div className="panel customer-empty">Завантаження…</div>}</>;
  const runningPercent = overview.fleet.total ? Math.round(overview.fleet.inTrip / overview.fleet.total * 100) : 0;
  const availableEnd = overview.fleet.total ? runningPercent + Math.round(overview.fleet.available / overview.fleet.total * 100) : 0;
  return <>
    <div className="page-heading dashboard-heading"><div><div className="eyebrow">{today}</div><h1>Доброго дня, {currentUser?.firstName ?? 'користувачу'}</h1></div></div>
    <section className="stats-grid">
      <Metric title="Рейсів сьогодні" value={String(overview.counts.tripsToday)} note="За поточну дату" icon="↗" tone="blue" />
      <Metric title="Зараз у дорозі" value={String(overview.counts.tripsInProgress)} note="Активні рейси" icon="◉" tone="navy" />
      <Metric title="Вільний транспорт" value={String(overview.counts.availableVehicles)} note="Статус: доступний" icon="▰" tone="red" />
      <Metric title="Потребують уваги" value={String(overview.counts.vehiclesNeedingAttention)} note="ТО або не експлуатується" icon="⚙" tone="amber" />
    </section>
    <section className="dashboard-grid dashboard-grid-single">
      <div className="panel fleet-panel"><div className="panel-heading"><div><h2>Стан автопарку</h2><span>{overview.fleet.total} транспортних засобів</span></div><Link className="text-link" to="/vehicles">Детальніше ↗</Link></div><div className="fleet-ring-wrap"><div className="fleet-ring" style={{ background: `conic-gradient(#3262d7 0 ${runningPercent}%,#27aa7f ${runningPercent}% ${availableEnd}%,#ed5964 ${availableEnd}% 100%)` }}><div><strong>{runningPercent}%</strong><small>у дорозі</small></div></div><div className="fleet-key"><div><i className="key-blue" /><span>У дорозі</span><b>{overview.fleet.inTrip}</b></div><div><i className="key-green" /><span>Доступні</span><b>{overview.fleet.available}</b></div><div><i className="key-red" /><span>На ТО / виведені</span><b>{overview.fleet.maintenance + overview.fleet.outOfService}</b></div></div></div></div>
    </section>
    <section className="panel table-panel recent-panel"><div className="panel-heading"><div><h2>Останні рейси</h2></div><Link className="text-link" to="/trips">Усі рейси →</Link></div>{overview.recentTrips.length === 0 ? <div className="customer-empty">Рейсів поки немає.</div> : <div className="table-wrap"><table><thead><tr><th>РЕЙС</th><th>МАРШРУТ</th><th>ВОДІЙ</th><th>ТРАНСПОРТ</th><th>ВИЇЗД</th><th>СТАТУС</th></tr></thead><tbody>{overview.recentTrips.map((trip) => <tr key={trip.id}><td><strong className="trip-id">#{trip.id}</strong></td><td>{trip.departurePoint} <i className="route-arrow">→</i> {trip.arrivalPoint}</td><td>{trip.driverFirstName ? `${trip.driverFirstName} ${trip.driverLastName ?? ''}` : 'Не призначено'}</td><td>{trip.vehicleType === 'train' ? 'Потяг' : trip.vehicleModel ?? '—'}</td><td>{trip.departureTime ? new Intl.DateTimeFormat('uk-UA', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(trip.departureTime)) : '—'}</td><td><Badge value={tripStatusLabels[trip.status] ?? trip.status} /></td></tr>)}</tbody></table></div>}</section>
  </>;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('');
    const form = new FormData(event.currentTarget);
    try {
      const { data } = await api.post('/auth/login', { email, password: form.get('password') });
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      navigate(data.user.role === 'dispatcher' ? '/dispatch/pending' : data.user.role === 'driver' ? '/driver/trips' : data.user.role === 'mechanic' ? '/mechanic/vehicles' : '/dashboard');
    } catch { setError('Перевірте пошту й пароль та спробуйте ще раз'); }
  };
  return <main className="login-page"><div className="login-photo"><Link to="/register" className="brand login-brand"><span className="brand-mark">Т</span><span><strong>ТРАНЗИТ</strong></span></Link><div className="login-photo-copy"><span>ВЕСЬ АВТОПАРК — В ОДНОМУ МІСЦІ</span><h1>Керуйте рухом<br />Плануйте впевнено</h1></div><div className="login-photo-credit">Фото: <a href="https://unsplash.com/photos/a-large-blue-truck-driving-down-a-road-C_EjEYdFc1Q" target="_blank" rel="noreferrer">Unsplash</a></div></div><div className="login-side"><form className="login-form" onSubmit={submit}><span className="eyebrow">РАДІ БАЧИТИ ВАС</span><h2>Вхід у систему</h2><p>Увійдіть, щоб продовжити роботу з автопарком</p><label htmlFor="email">Електронна пошта</label><input id="email" type="email" placeholder="name@company.ua" value={email} onChange={(event) => setEmail(event.target.value)} required /><label htmlFor="password">Пароль</label><input id="password" name="password" type="password" placeholder="Введіть пароль" required minLength={8} />{error && <small className="auth-error">{error}</small>}<button className="primary-button login-submit">Увійти</button><small className="login-demo-note">Ще не маєте облікового запису? <Link to="/register">Зареєструватися</Link></small></form><div className="login-footer">© 2026 Транзит · Керування транспортом</div></div></main>;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('');
    const form = new FormData(event.currentTarget);
    try {
      const { data } = await api.post('/auth/register', {
        firstName: form.get('firstName'), lastName: form.get('lastName'),
        email: form.get('email'), password: form.get('password'),
      });
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (reason: any) {
      setError(reason?.response?.data?.message ?? 'Не вдалося створити обліковий запис');
    }
  };
  return <main className="login-page"><div className="login-photo"><Link to="/register" className="brand login-brand"><span className="brand-mark">Т</span><span><strong>ТРАНЗИТ</strong></span></Link><div className="login-photo-copy"><span>ПАСАЖИРСЬКІ ТА ВАНТАЖНІ ПЕРЕВЕЗЕННЯ</span><h1>Плануйте<br />свою поїздку</h1></div><div className="login-photo-credit">© 2026 Транзит</div></div><div className="login-side"><form className="login-form" onSubmit={submit}><span className="eyebrow">СТВОРІТЬ ОБЛІКОВИЙ ЗАПИС</span><h2>Реєстрація</h2><p>Зареєструйтеся як клієнт, щоб замовити перевезення</p><label htmlFor="firstName">Ім’я</label><input id="firstName" name="firstName" autoComplete="given-name" required minLength={2} /><label htmlFor="lastName">Прізвище</label><input id="lastName" name="lastName" autoComplete="family-name" required minLength={2} /><label htmlFor="registerEmail">Електронна пошта</label><input id="registerEmail" name="email" type="email" autoComplete="email" placeholder="name@example.com" required /><label htmlFor="registerPassword">Пароль</label><input id="registerPassword" name="password" type="password" autoComplete="new-password" minLength={8} placeholder="Щонайменше 8 символів" required />{error && <small className="auth-error">{Array.isArray(error) ? error.join(', ') : error}</small>}<button className="primary-button login-submit">Зареєструватися</button><small className="login-demo-note">Вже маєте обліковий запис? <Link to="/login">Увійти</Link></small></form><div className="login-footer">© 2026 Транзит · Керування транспортом</div></div></main>;
}

export const TripsPage = () => <SectionPage section="trips" />;
export const VehiclesPage = () => <SectionPage section="vehicles" />;
