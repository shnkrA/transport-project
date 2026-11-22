import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getCurrentUser } from '../services/session';

const pages = {
  orders: { title: 'Замовлення', group: 'ОПЕРАЦІЇ', description: 'Заявки клієнтів і стан обробки перевезень.', action: '＋ Нове замовлення', heads: ['Номер', 'Клієнт', 'Маршрут', 'Дата', 'Статус'], rows: [['ЗМ-0248', 'ТОВ «АгроТранс»', 'Київ → Львів', '15 листопада', 'Підтверджено'], ['ЗМ-0247', 'ПП «Вектор»', 'Одеса → Київ', '15 листопада', 'На розгляді'], ['ЗМ-0246', 'ТОВ «Будсервіс»', 'Дніпро → Харків', '14 листопада', 'Виконано']] },
  trips: { title: 'Рейси', group: 'ОПЕРАЦІЇ', description: 'Поточний стан перевезень і призначення екіпажів.', action: '＋ Створити рейс', heads: ['Рейс', 'Маршрут', 'Водій', 'Виїзд', 'Статус'], rows: [['РС-0186', 'Київ → Львів', 'Олександр Коваль', '09:30', 'У дорозі'], ['РС-0185', 'Одеса → Київ', 'Ірина Мельник', '11:15', 'Заплановано'], ['РС-0184', 'Дніпро → Харків', 'Сергій Бондар', '08:00', 'Завершено']] },
  vehicles: { title: 'Автопарк', group: 'РЕСУРСИ', description: 'Стан транспортних засобів і готовність до виїзду.', action: '＋ Додати транспорт', heads: ['Транспорт', 'Номер', 'Тип', 'Пробіг', 'Стан'], rows: [['Mercedes-Benz Actros', 'КА 4821 МК', 'Вантажівка', '184 230 км', 'На маршруті'], ['Volvo FH', 'АІ 9034 РТ', 'Вантажівка', '126 480 км', 'Готовий'], ['MAN Lion’s Coach', 'АА 1120 ОХ', 'Автобус', '208 510 км', 'Планове ТО']] },
  drivers: { title: 'Водії', group: 'КОМАНДА', description: 'Доступність водіїв і призначення на зміну.', action: '＋ Додати водія', heads: ['Водій', 'Телефон', 'Категорія', 'Зміна', 'Статус'], rows: [['Олександр Коваль', '+380 67 123 45 67', 'C, CE', '06:00–18:00', 'На рейсі'], ['Ірина Мельник', '+380 63 248 19 02', 'B, C', '08:00–20:00', 'Доступна'], ['Сергій Бондар', '+380 50 786 24 11', 'C, CE', '07:00–19:00', 'Відпочинок']] },
  maintenance: { title: 'Техобслуговування', group: 'АВТОПАРК', description: 'Планові огляди, ремонти та готовність транспорту.', action: '＋ Створити заявку', heads: ['Транспорт', 'Роботи', 'Дата', 'Відповідальний', 'Статус'], rows: [['MAN Lion’s Coach · АА 1120 ОХ', 'Планове ТО', '16 листопада', 'Автосервіс №1', 'Заплановано'], ['Renault Master · АІ 5001 КВ', 'Заміна мастила', '14 листопада', 'М. Петренко', 'В роботі'], ['Volvo FH · АІ 9034 РТ', 'Діагностика', '12 листопада', 'М. Петренко', 'Завершено']] },
  analytics: { title: 'Аналітика', group: 'ЗВІТНІСТЬ', description: 'Показники роботи автопарку за поточний місяць.', action: '↓ Завантажити звіт', heads: ['Показник', 'Поточне значення', 'Зміна'], rows: [['Виконані рейси', '248', '+12%'], ['Пробіг автопарку', '86 420 км', '+8%'], ['Витрати пального', '18 640 л', '−3%']] },
};
type SectionKey = keyof typeof pages;

function Badge({ value }: { value: string }) {
  const tone = /рейс|маршрут|роботі/i.test(value) ? 'blue' : /план|розгляд|то/i.test(value) ? 'amber' : /готов|підтвердж|викон|доступ/i.test(value) ? 'green' : 'red';
  return <span className={`status-pill ${tone}`}><i />{value}</span>;
}

function SectionPage({ section }: { section: SectionKey }) {
  const data = pages[section];
  return <>
    <div className="page-heading"><div><div className="eyebrow">{data.group}</div><h1>{data.title}</h1><p>{data.description}</p></div><button className="primary-button">{data.action}</button></div>
    <section className="panel table-panel"><div className="panel-heading"><div><h2>Останні записи</h2><span>Демонстраційні дані · оновлено щойно</span></div><button className="filter-button">☷ Фільтри</button></div>
      <div className="table-wrap"><table><thead><tr>{data.heads.map((head) => <th key={head}>{head}</th>)}</tr></thead><tbody>{data.rows.map((row) => <tr key={row[0]}>{row.map((cell, i) => <td key={cell}>{i === row.length - 1 ? <Badge value={cell} /> : cell}</td>)}</tr>)}</tbody></table></div>
      <div className="table-footer">Показано {data.rows.length} записів <div><button disabled>←</button><button className="current-page">1</button><button disabled>→</button></div></div>
    </section>
  </>;
}

function Metric({ title, value, note, icon, tone }: { title: string; value: string; note: string; icon: string; tone: string }) {
  return <article className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><div className="metric-label">{title}</div><div className="metric-value">{value}</div><div className="metric-foot">{note}</div></article>;
}

export function DashboardPage() {
  const currentUser = getCurrentUser();
  const bars = [48, 67, 53, 82, 62, 92, 74];
  const today = new Intl.DateTimeFormat('uk-UA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date()).toLocaleUpperCase('uk-UA');
  return <>
    <div className="page-heading dashboard-heading"><div><div className="eyebrow">{today}</div><h1>Доброго дня, {currentUser?.firstName ?? 'користувачу'}</h1><p>Ось що відбувається у вашому автопарку сьогодні</p></div></div>
    <section className="hero-card"><div className="hero-copy"><span className="hero-tag"><i /> ОГЛЯД АВТОПАРКУ</span><h2>Рухаємося<br />за планом</h2><p>Більшість рейсів сьогодні виконуються вчасно. Перегляньте актуальний стан перевезень</p><Link to="/trips" className="hero-link">Переглянути рейси <span>↗</span></Link></div><div className="hero-image-credit">Фото: <a href="https://driveforce.ua/assets/uploads/images/content/5529f-nayshvidshi-avtobusi.png" target="_blank" rel="noreferrer">DriveForce</a></div></section>
    <section className="stats-grid">
      <Metric title="Рейсів сьогодні" value="24" note="↗ 8% до минулого тижня" icon="↗" tone="blue" />
      <Metric title="Зараз у дорозі" value="18" note="75% усіх запланованих" icon="◉" tone="navy" />
      <Metric title="Вільний транспорт" value="06" note="Готові до виїзду" icon="▰" tone="red" />
      <Metric title="Потребують уваги" value="02" note="Планове ТО цього тижня" icon="⚙" tone="amber" />
    </section>
    <section className="dashboard-grid">
      <div className="panel activity-panel"><div className="panel-heading"><div><h2>Активність рейсів</h2><span>Виконання за останні 7 днів</span></div><button className="more-button">···</button></div><div className="chart-legend"><span><i className="legend-blue" /> Виконані</span><span><i className="legend-light" /> Заплановані</span></div><div className="chart"><div className="chart-y"><span>30</span><span>20</span><span>10</span><span>0</span></div><div className="chart-bars">{bars.map((bar, index) => <div className="bar-group" key={index}><div className="bar-pair"><i style={{ height: `${bar}%` }} /><i style={{ height: `${Math.max(19, bar - 24)}%` }} /></div><span>{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'][index]}</span></div>)}</div></div></div>
      <div className="panel fleet-panel"><div className="panel-heading"><div><h2>Стан автопарку</h2><span>24 транспортні засоби</span></div><Link className="text-link" to="/vehicles">Детальніше ↗</Link></div><div className="fleet-ring-wrap"><div className="fleet-ring"><div><strong>75%</strong><small>у роботі</small></div></div><div className="fleet-key"><div><i className="key-blue" /><span>У рейсі</span><b>18</b></div><div><i className="key-green" /><span>Доступні</span><b>4</b></div><div><i className="key-red" /><span>На ТО</span><b>2</b></div></div></div><div className="fleet-note"><span>↗</span> Автопарк активніший на <b>8%</b> цього тижня</div></div>
    </section>
    <section className="panel table-panel recent-panel"><div className="panel-heading"><div><h2>Поточні рейси</h2><span>Свіжа інформація з автопарку</span></div><Link className="text-link" to="/trips">Усі рейси →</Link></div><div className="table-wrap"><table><thead><tr><th>РЕЙС</th><th>МАРШРУТ</th><th>ВОДІЙ</th><th>ТРАНСПОРТ</th><th>ВИЇЗД</th><th>СТАТУС</th></tr></thead><tbody>
      <tr><td><strong className="trip-id">#РС-0186</strong></td><td>Київ <i className="route-arrow">→</i> Львів</td><td><span className="driver-cell"><i className="mini-avatar">ОК</i>Олександр Коваль</span></td><td>Mercedes-Benz Actros</td><td>09:30</td><td><Badge value="У дорозі" /></td></tr>
      <tr><td><strong className="trip-id">#РС-0185</strong></td><td>Одеса <i className="route-arrow">→</i> Київ</td><td><span className="driver-cell"><i className="mini-avatar pink">ІМ</i>Ірина Мельник</span></td><td>Volvo FH</td><td>11:15</td><td><Badge value="Заплановано" /></td></tr>
      <tr><td><strong className="trip-id">#РС-0184</strong></td><td>Дніпро <i className="route-arrow">→</i> Харків</td><td><span className="driver-cell"><i className="mini-avatar green">СБ</i>Сергій Бондар</span></td><td>MAN Lion’s Coach</td><td>08:00</td><td><Badge value="Завершено" /></td></tr>
    </tbody></table></div><div className="demo-note"><span>i</span> Показані дані демонстраційні й поки не підключені до бази.</div></section>
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
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch { setError('Перевірте пошту й пароль та спробуйте ще раз.'); }
  };
  return <main className="login-page"><div className="login-photo"><Link to="/register" className="brand login-brand"><span className="brand-mark">Т</span><span><strong>ТРАНЗИТ</strong><small>СИСТЕМА КЕРУВАННЯ</small></span></Link><div className="login-photo-copy"><span>ВЕСЬ АВТОПАРК — В ОДНОМУ МІСЦІ</span><h1>Керуйте рухом.<br />Плануйте впевнено.</h1></div><div className="login-photo-credit">Фото: <a href="https://unsplash.com/photos/a-large-blue-truck-driving-down-a-road-C_EjEYdFc1Q" target="_blank" rel="noreferrer">Unsplash</a></div></div><div className="login-side"><form className="login-form" onSubmit={submit}><span className="eyebrow">РАДІ БАЧИТИ ВАС</span><h2>Вхід у систему</h2><p>Увійдіть, щоб продовжити роботу з автопарком.</p><label htmlFor="email">Електронна пошта</label><input id="email" type="email" placeholder="name@company.ua" value={email} onChange={(event) => setEmail(event.target.value)} required /><label htmlFor="password">Пароль</label><input id="password" name="password" type="password" placeholder="Введіть пароль" required minLength={8} />{error && <small className="auth-error">{error}</small>}<button className="primary-button login-submit">Увійти</button><small className="login-demo-note">Ще не маєте облікового запису? <Link to="/register">Зареєструватися</Link></small></form><div className="login-footer">© 2026 Транзит · Керування транспортом</div></div></main>;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('');
    const form = new FormData(event.currentTarget);
    try {
      await api.post('/auth/register', {
        firstName: form.get('firstName'), lastName: form.get('lastName'),
        email: form.get('email'), password: form.get('password'),
      });
      navigate('/login', { state: { registered: true } });
    } catch (reason: any) {
      setError(reason?.response?.data?.message ?? 'Не вдалося створити обліковий запис');
    }
  };
  return <main className="login-page"><div className="login-photo"><Link to="/register" className="brand login-brand"><span className="brand-mark">Т</span><span><strong>ТРАНЗИТ</strong><small>СИСТЕМА КЕРУВАННЯ</small></span></Link><div className="login-photo-copy"><span>ПАСАЖИРСЬКІ ТА ВАНТАЖНІ ПЕРЕВЕЗЕННЯ</span><h1>Плануйте<br />свою поїздку</h1></div><div className="login-photo-credit">© 2026 Транзит</div></div><div className="login-side"><form className="login-form" onSubmit={submit}><span className="eyebrow">СТВОРІТЬ ОБЛІКОВИЙ ЗАПИС</span><h2>Реєстрація</h2><p>Зареєструйтеся як клієнт, щоб замовити перевезення.</p><label htmlFor="firstName">Ім’я</label><input id="firstName" name="firstName" autoComplete="given-name" required minLength={2} /><label htmlFor="lastName">Прізвище</label><input id="lastName" name="lastName" autoComplete="family-name" required minLength={2} /><label htmlFor="registerEmail">Електронна пошта</label><input id="registerEmail" name="email" type="email" autoComplete="email" placeholder="name@example.com" required /><label htmlFor="registerPassword">Пароль</label><input id="registerPassword" name="password" type="password" autoComplete="new-password" minLength={8} placeholder="Щонайменше 8 символів" required />{error && <small className="auth-error">{Array.isArray(error) ? error.join(', ') : error}</small>}<button className="primary-button login-submit">Зареєструватися</button><small className="login-demo-note">Вже маєте обліковий запис? <Link to="/login">Увійти</Link></small></form><div className="login-footer">© 2026 Транзит · Керування транспортом</div></div></main>;
}

export const OrdersPage = () => <SectionPage section="orders" />;
export const TripsPage = () => <SectionPage section="trips" />;
export const VehiclesPage = () => <SectionPage section="vehicles" />;
export const DriversPage = () => <SectionPage section="drivers" />;
export const MaintenancePage = () => <SectionPage section="maintenance" />;
export const AnalyticsPage = () => <SectionPage section="analytics" />;
