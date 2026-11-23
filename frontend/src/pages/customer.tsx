import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getCurrentUser } from '../services/session';

type Vehicle = { id: number; vehicleType: string; status: string; model: string; licensePlate: string; capacitySeats?: number };
type RouteRow = { id: number; origin: string; destination: string; transportType: 'bus' | 'train'; distanceKm: number; durationMinutes: number; trainNumber?: string; departureTime: string; sourceUrl?: string };
type Catalog = { routes: RouteRow[] };
type Proposal = { route: RouteRow; vehicle: Vehicle; departureAt: string; fare: number; driver: string | null };
type CustomerTrip = {
  id: number; departurePoint: string; arrivalPoint: string; departure_point?: string; arrival_point?: string;
  departureTime?: string; departure_time?: string; vehicleType?: string; vehicle_type?: string;
  vehicleModel?: string; vehicle_model?: string; cost: string | number; status: string;
  passengerCount?: number; passenger_count?: number; routeStops?: string[]; route_stops?: string[];
  seatType?: string; seat_type?: string; seatNumbers?: number[]; seat_numbers?: number[];
  notes?: string; trainNumber?: string;
};

const seatClasses = [
  { value: 'купе', label: 'Купе', multiplier: 1.8 },
  { value: 'плацкарт', label: 'Плацкарт', multiplier: 1.25 },
  { value: 'сидяче', label: 'Сидяче', multiplier: 1 },
];
const riskPlaceNames = ['харків', 'запоріж', 'херсон', 'донецьк', 'луганськ', 'сум', 'черніг', 'краматорськ', 'покровськ', 'бердянськ', 'мелітополь', 'енергодар', 'дніпропетров', 'кривий ріг', 'павлоград'];

function useCustomerData() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [catalog, setCatalog] = useState<Catalog>({ routes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([api.get('/vehicles'), api.get('/trips/catalog')])
      .then(([vehicleResponse, catalogResponse]) => {
        const rows = Array.isArray(vehicleResponse.data) ? vehicleResponse.data : vehicleResponse.data?.items ?? [];
        setVehicles(rows.filter((vehicle: Vehicle) => vehicle.status?.toLowerCase() === 'available'));
        setCatalog(catalogResponse.data);
      })
      .catch(() => setError('Не вдалося завантажити маршрути й транспорт. Перевірте запуск сервера та застосування міграцій.'))
      .finally(() => setLoading(false));
  }, []);
  return { vehicles, catalog, loading, error };
}

function localDateTime(date: string, time: string) {
  const [hour = '08', minute = '00'] = String(time).split(':');
  return `${date}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function getFare(proposal: Proposal, passengerCount: number, seatClass: string) {
  const multiplier = proposal.route.transportType === 'train' ? seatClasses.find((seat) => seat.value === seatClass)?.multiplier ?? 1 : 1.5;
  const baseRate = proposal.route.transportType === 'train' ? 1.6 : 1.6;
  return Math.round(proposal.route.distanceKm * passengerCount * baseRate * multiplier * 100) / 100;
}

export function CustomerDashboardPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  return <>
    <div className="page-heading customer-welcome"><div><div className="eyebrow">ОСОБИСТИЙ КАБІНЕТ</div><h1>Вітаємо, {user?.firstName ?? 'мандрівнику'}!</h1><p>Знайдіть доступний маршрут або розрахуйте свою поїздку.</p></div></div>
    <section className="customer-home-grid">
      <article className="customer-home-card customer-home-primary"><div className="customer-home-icon">↗</div><span className="eyebrow">ПЛАНУВАННЯ ПОЇЗДКИ</span><h2>Куди вирушаємо?</h2><p>Вкажіть міста, дату та кількість пасажирів. Ми покажемо доступні варіанти транспорту й орієнтовну вартість.</p><button className="primary-button" onClick={() => navigate('/trips?create=1')}>Створити рейс</button></article>
      <article className="customer-home-card"><div className="customer-home-icon transport">▰</div><span className="eyebrow">ТРАНСПОРТ</span><h2>Переглянути доступне</h2><p>Автобуси й вагони, які зараз позначені доступними в системі.</p><Link to="/available-transport" className="text-link">Доступний транспорт →</Link><Link to="/my-trips" className="text-link customer-my-trips-link">Мої майбутні й минулі рейси →</Link></article>
    </section>
    <div className="customer-info-strip"><span>i</span><p>Час і ціна у пропозиціях орієнтовні. Остаточний рейс підтверджує диспетчер.</p></div>
  </>;
}

export function CustomerMyTripsPage() {
  const [trips, setTrips] = useState<CustomerTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  useEffect(() => {
    api.get('/trips/mine').then(({ data }) => setTrips(Array.isArray(data) ? data : []))
      .catch((reason) => setError(reason?.response?.status === 401 ? 'Сесія завершилася. Вийдіть і увійдіть знову, щоб переглянути рейси.' : 'Не вдалося завантажити ваші рейси. Спробуйте оновити сторінку.'))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const upcoming = trips.filter((trip) => {
    const departure = trip.departureTime ?? trip.departure_time;
    return departure && new Date(departure) >= now;
  });
  const past = trips.filter((trip) => {
    const departure = trip.departureTime ?? trip.departure_time;
    return departure && new Date(departure) < now;
  });
  const shownTrips = filter === 'upcoming' ? upcoming : filter === 'past' ? past : trips;
  const statusLabel: Record<string, string> = { pending: 'Очікує підтвердження', confirmed: 'Підтверджено', scheduled: 'Заплановано', completed: 'Завершено', cancelled: 'Скасовано', in_progress: 'У дорозі' };

  return <>
    <div className="page-heading"><div><div className="eyebrow">ІСТОРІЯ ПОЇЗДОК</div><h1>Мої рейси</h1><p>Тут зберігаються ваші майбутні та минулі поїздки.</p></div><Link className="primary-button customer-cta" to="/trips?create=1">＋ Створити рейс</Link></div>
    <div className="my-trips-tabs" role="tablist" aria-label="Фільтр рейсів">
      <button className={filter === 'upcoming' ? 'active' : ''} onClick={() => setFilter('upcoming')}>Майбутні <span>{upcoming.length}</span></button>
      <button className={filter === 'past' ? 'active' : ''} onClick={() => setFilter('past')}>Минулі <span>{past.length}</span></button>
      <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Усі <span>{trips.length}</span></button>
    </div>
    {loading && <div className="panel customer-empty">Завантажуємо ваші рейси…</div>}
    {error && <div className="customer-alert danger">{error}</div>}
    {!loading && !error && shownTrips.length === 0 && <div className="panel customer-empty"><h2>{filter === 'past' ? 'Минулі рейси з’являться тут' : 'Майбутніх рейсів поки немає'}</h2><p>Створені заявки залишатимуться в історії після поїздки.</p>{filter !== 'past' && <Link to="/trips?create=1" className="primary-button">Знайти рейс</Link>}</div>}
    {!loading && shownTrips.map((trip) => {
      const origin = trip.departurePoint ?? trip.departure_point ?? '—';
      const destination = trip.arrivalPoint ?? trip.arrival_point ?? '—';
      const departure = trip.departureTime ?? trip.departure_time;
      const model = trip.vehicleModel ?? trip.vehicle_model;
      const mode = trip.vehicleType ?? trip.vehicle_type;
      const stops = trip.routeStops ?? trip.route_stops ?? [];
      const seats = trip.seatNumbers ?? trip.seat_numbers ?? [];
      const status = statusLabel[trip.status] ?? trip.status;
      let trainNumber = '';
      if (trip.notes) trainNumber = trip.notes.match(/(?:потяга з каталогу: )([^.]*)/i)?.[1] ?? '';
      return <article className="panel my-trip-card" key={trip.id}>
        <div className="my-trip-top"><span className="trip-id">Рейс №{trip.id}</span><span className={`trip-status ${trip.status}`}>{status}</span></div>
        <h2>{origin} <i>→</i> {destination}</h2>
        {stops.length > 0 && <p className="my-trip-stops">Зупинки: {stops.join(' · ')}</p>}
        <div className="my-trip-meta"><span>Дата та час<strong>{departure ? formatDateTime(departure) : 'Не вказано'}</strong></span><span>{mode === 'train' ? 'Потяг' : 'Транспорт'}<strong>{mode === 'train' ? `№ ${trainNumber || '—'}` : model ?? 'Автобус'}</strong></span>{mode === 'train' && <span>Місця<strong>{seats.length ? `${seats.join(', ')} · ${trip.seatType ?? trip.seat_type ?? ''}` : 'Не вказано'}</strong></span>}<span>Пасажири<strong>{trip.passengerCount ?? trip.passenger_count ?? '—'}</strong></span><span>Вартість<strong>{Number(trip.cost).toLocaleString('uk-UA', { minimumFractionDigits: 2 })} грн</strong></span></div>
      </article>;
    })}
    <p className="customer-disclaimer">Історія завантажується з бази даних за вашим обліковим записом і зберігає як майбутні, так і завершені рейси.</p>
  </>;
}

export function AvailableTransportPage() {
  const { vehicles, loading, error } = useCustomerData();
  return <>
    <div className="page-heading"><div><div className="eyebrow">ДЛЯ ВАШОЇ ПОЇЗДКИ</div><h1>Доступний транспорт</h1><p>Транспорт, позначений як доступний у системі.</p></div><Link to="/trips?create=1" className="primary-button customer-cta">Створити рейс →</Link></div>
    {loading && <div className="panel customer-empty">Завантажуємо транспорт…</div>}
    {error && <div className="customer-alert danger">{error}</div>}
    {!loading && !error && !vehicles.length && <div className="panel customer-empty">Наразі доступного транспорту немає.</div>}
    <section className="customer-vehicle-grid">{vehicles.map((vehicle) => <article className="panel customer-vehicle-card" key={vehicle.id}>
      <div className={`customer-vehicle-icon ${vehicle.vehicleType === 'train' ? 'train' : ''}`}>{vehicle.vehicleType === 'train' ? '🚆' : '🚌'}</div><span className="customer-available"><i /> Доступний</span><h2>{vehicle.model}</h2>
      <p>{vehicle.vehicleType === 'train' ? 'Вагон' : 'Автобус'} · до {vehicle.capacitySeats ?? '—'} пасажирів</p><Link to="/trips?create=1" className="text-link">Розрахувати поїздку ↗</Link>
    </article>)}</section>
    <p className="customer-disclaimer">Статус і місткість беремо з бази проєкту. Реальний розклад, наявність квитків і зайняті місця не синхронізуються з Укрзалізницею.</p>
  </>;
}

export function CustomerTripsPage() {
  const location = useLocation();
  const { vehicles, catalog, loading, error } = useCustomerData();
  const [formOpen, setFormOpen] = useState(new URLSearchParams(location.search).get('create') === '1');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [passengers, setPassengers] = useState('1');
  const [seatClass, setSeatClass] = useState('купе');
  const [seatNumbers, setSeatNumbers] = useState<Record<number, string[]>>({});
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [message, setMessage] = useState('');
  const [busyVehicle, setBusyVehicle] = useState<number | null>(null);
  const passengerCount = Math.max(1, Number(passengers) || 1);
  const places = useMemo(() => Array.from(new Set(catalog.routes.flatMap((route) => [route.origin, route.destination]))).sort((a, b) => a.localeCompare(b, 'uk')), [catalog.routes]);
  const isRiskRoute = [origin, destination].some((place) => riskPlaceNames.some((name) => place.toLocaleLowerCase('uk-UA').includes(name)));

  useEffect(() => {
    setFormOpen(new URLSearchParams(location.search).get('create') === '1');
  }, [location.search]);

  const calculate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    const matched = catalog.routes.filter((route) => route.origin.toLocaleLowerCase('uk-UA') === origin.trim().toLocaleLowerCase('uk-UA') && route.destination.toLocaleLowerCase('uk-UA') === destination.trim().toLocaleLowerCase('uk-UA'));
    const options: Proposal[] = matched.flatMap((route) => {
      const vehicle = vehicles.filter((item) => item.vehicleType === route.transportType && (item.capacitySeats ?? 0) >= passengerCount).sort((a, b) => (a.capacitySeats ?? 0) - (b.capacitySeats ?? 0))[0];
      if (!vehicle) return [];
      const rate = route.transportType === 'train' ? 1.6 * (seatClasses.find((seat) => seat.value === seatClass)?.multiplier ?? 1) : 2.4;
      return [{ route, vehicle, departureAt: localDateTime(travelDate, route.departureTime), fare: Math.round(route.distanceKm * passengerCount * rate * 100) / 100, driver: null }];
    });
    setProposals(options);
    if (!options.length) setMessage(matched.length ? 'Немає доступного транспорту з достатньою кількістю місць.' : 'Маршруту для цих міст поки немає в каталозі. Оберіть міста зі списку або перевірте написання.');
    else setMessage(`Знайдено варіантів: ${options.length}. Оберіть пропозицію нижче.`);
  };

  const submitProposal = async (proposal: Proposal) => {
    if (proposal.route.transportType === 'train' && (seatNumbers[proposal.vehicle.id]?.length ?? 0) !== passengerCount) {
      setMessage(`Для потяга виберіть ${passengerCount} місце(ць) у пропозиції.`); return;
    }
    setBusyVehicle(proposal.vehicle.id); setMessage('');
    const user = getCurrentUser();
    try {
      await api.post('/trips', {
        customerId: user?.id, customerName: `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim(),
        vehicleId: proposal.vehicle.id, departurePoint: proposal.route.origin, arrivalPoint: proposal.route.destination,
        departureTime: new Date(proposal.departureAt).toISOString(), status: 'pending', passengerCount,
        routeDistanceKm: proposal.route.distanceKm, routeStops: [], cost: proposal.fare,
        seatType: proposal.route.transportType === 'train' ? seatClass : null,
        seatNumbers: proposal.route.transportType === 'train' ? seatNumbers[proposal.vehicle.id].map(Number) : null,
        notes: proposal.route.transportType === 'train' ? `Номер потяга з каталогу: ${proposal.route.trainNumber}. Пропозиція потребує підтвердження.` : 'Попередня пропозиція рейсу; потрібне підтвердження диспетчера.',
      });
      setMessage('Заявку на рейс надіслано. Очікуйте підтвердження диспетчера.');
    } catch (reason: any) {
      setMessage(reason?.response?.data?.message ?? 'Не вдалося надіслати заявку. Перевірте з’єднання з сервером.');
    } finally { setBusyVehicle(null); }
  };

  return <>
    <div className="page-heading"><div><div className="eyebrow">ВАШІ ПОЇЗДКИ</div><h1>Рейси</h1><p>Вкажіть маршрут і дату — система запропонує відповідний транспорт.</p></div><button className="primary-button customer-cta" onClick={() => setFormOpen((open) => !open)}>{formOpen ? 'Згорнути форму' : '＋ Створити рейс'}</button></div>
    {error && <div className="customer-alert danger">{error}</div>}
    {formOpen && <form className="panel customer-search-form" onSubmit={calculate}>
      <div className="panel-heading"><div><h2>Параметри поїздки</h2><span>Після розрахунку пропозиції з’являться нижче</span></div><span className="step-number">01</span></div>
      <div className="customer-search-fields">
        <div className="customer-field"><label htmlFor="trip-origin">Точка А · звідки</label><input id="trip-origin" list="route-cities" value={origin} onChange={(event) => setOrigin(event.target.value)} placeholder="Оберіть місто" required /><datalist id="route-cities">{places.map((place) => <option key={place} value={place} />)}</datalist></div>
        <div className="customer-field"><label htmlFor="trip-destination">Точка Б · куди</label><input id="trip-destination" list="route-cities" value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Оберіть місто" required /></div>
        <div className="customer-field"><label htmlFor="trip-date">Дата поїздки</label><input id="trip-date" type="date" value={travelDate} onChange={(event) => setTravelDate(event.target.value)} min={new Date().toISOString().slice(0, 10)} required /></div>
        <div className="customer-field"><label htmlFor="trip-passengers">Пасажири</label><input id="trip-passengers" type="number" min="1" max="54" value={passengers} onChange={(event) => setPassengers(event.target.value)} required /></div>
      </div>
      <button className="primary-button customer-submit" type="submit" disabled={loading || !catalog.routes.length}>{loading ? 'Завантаження маршрутів…' : 'Розрахувати рейс'}</button>
      {message && <div className={`customer-alert ${message.startsWith('Заявку') ? 'success' : 'info'}`}>{message}</div>}
    </form>}
    {isRiskRoute && <div className="customer-alert warning"><strong>Рейс може бути небезпечним, можливі зміни маршруту або скасування.</strong><span>Указаний напрямок проходить через Харківську, Запорізьку чи іншу область, де до переліку внесено окремі громади. Перевірте саме населений пункт і актуальну ситуацію перед поїздкою у <a href="https://dp-reintegration.gov.ua/?p=2371" target="_blank" rel="noreferrer">державному переліку</a>. Перелік не є оперативним попередженням про повітряну тривогу.</span></div>}
    {proposals.length > 0 && <section className="customer-proposals"><div className="panel-heading"><div><h2>Пропоновані рейси</h2><span>{origin} → {destination} · {travelDate}</span></div><span className="step-number">{proposals.length}</span></div>
      {proposals.map((proposal) => <article className="panel customer-proposal-card" key={`${proposal.route.id}-${proposal.vehicle.id}`}>
        <div className="proposal-main"><div className={`customer-vehicle-icon ${proposal.route.transportType === 'train' ? 'train' : ''}`}>{proposal.route.transportType === 'train' ? '🚆' : '🚌'}</div><div><span className="proposal-mode">{proposal.route.transportType === 'train' ? `Потяг № ${proposal.route.trainNumber}` : 'Автобус'}</span><h3>{proposal.route.origin} <i>→</i> {proposal.route.destination}</h3><p>Відправлення: {formatDateTime(proposal.departureAt)} · орієнтовно {Math.floor(proposal.route.durationMinutes / 60)} год {proposal.route.durationMinutes % 60} хв</p></div></div>
        <div className="proposal-details">{proposal.route.transportType === 'bus' ? <><span>Транспорт<strong>{proposal.vehicle.model}</strong></span><span>Водій<strong>{proposal.driver ? `${proposal.driver} · підтвердить диспетчер` : 'Призначить диспетчер'}</strong></span></> : <span>Місця у вагоні<strong>До {proposal.vehicle.capacitySeats} за місткістю</strong></span>}<span>Вартість<strong>{getFare(proposal, passengerCount, seatClass).toLocaleString('uk-UA', { minimumFractionDigits: 2 })} грн</strong></span></div>
        {proposal.route.transportType === 'train' && <div className="customer-field proposal-seat-picker"><label htmlFor={`seats-${proposal.vehicle.id}`}>Тип місця та номери · потрібно {passengerCount}</label><select className="seat-class-select" value={seatClass} onChange={(event) => setSeatClass(event.target.value)}>{seatClasses.map((seat) => <option key={seat.value} value={seat.value}>{seat.label}</option>)}</select><select id={`seats-${proposal.vehicle.id}`} multiple size={Math.min(4, proposal.vehicle.capacitySeats ?? 4)} value={seatNumbers[proposal.vehicle.id] ?? []} onChange={(event) => setSeatNumbers((current) => ({ ...current, [proposal.vehicle.id]: Array.from(event.target.selectedOptions, (option) => option.value) }))}>{Array.from({ length: proposal.vehicle.capacitySeats ?? 0 }, (_, index) => <option value={index + 1} key={index + 1}>Місце {index + 1}</option>)}</select><small>Варіанти місць побудовані за місткістю вагона; актуальний продаж квитків не перевіряється.</small></div>}
        <div className="proposal-actions"><span>Місткість: {proposal.vehicle.capacitySeats ?? '—'} місць · відстань ~{proposal.route.distanceKm} км</span><button className="primary-button" onClick={() => submitProposal({ ...proposal, fare: getFare(proposal, passengerCount, seatClass) })} disabled={busyVehicle !== null}>{busyVehicle === proposal.vehicle.id ? 'Надсилаємо…' : 'Обрати рейс'}</button></div>
      </article>)}
      <p className="customer-disclaimer">Це попередні пропозиції з каталогу маршрутів. Розклад і ціна не є квитком; диспетчер підтвердить транспорт і деталі.</p>
      {message && !formOpen && <div className="customer-alert success">{message}</div>}
    </section>}
    {!proposals.length && !formOpen && !loading && <div className="panel customer-empty"><h2>Поки немає розрахованих рейсів</h2><p>Натисніть «Створити рейс», щоб побачити пропозиції для своєї поїздки.</p><button className="primary-button" onClick={() => setFormOpen(true)}>Створити рейс</button></div>}
    <p className="customer-disclaimer">Для потягів номери й орієнтовні години імпортовано з публічних сторінок Укрзалізниці. Перед поїздкою звірте дані в <a href="https://booking.uz.gov.ua/schedule/" target="_blank" rel="noreferrer">офіційному розкладі</a>. Вартість є орієнтовною, а наявність місць не синхронізується з УЗ.</p>
  </>;
}
