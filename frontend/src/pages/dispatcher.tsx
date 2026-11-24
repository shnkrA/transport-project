import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { useAutoRefresh } from '../services/use-auto-refresh';

type DispatchTrip = {
  id: number; status: string; customerName?: string; customer_name?: string;
  customerFirstName?: string; customerLastName?: string; departurePoint?: string; departure_point?: string;
  arrivalPoint?: string; arrival_point?: string; departureTime?: string; departure_time?: string;
  passengerCount?: number; passenger_count?: number; cost: number | string; notes?: string;
  serviceType?: string; service_type?: string; cargoWeightKg?: number | string; cargo_weight_kg?: number | string;
  cargoDimensions?: string; cargo_dimensions?: string;
  routeStops?: string[]; route_stops?: string[]; seatType?: string; seat_type?: string; seatNumbers?: number[]; seat_numbers?: number[];
  vehicleId?: number; vehicle_id?: number; vehicleType?: string; vehicle_type?: string; vehicleModel?: string; vehicle_model?: string;
  licensePlate?: string; vehicleStatus?: string; driverId?: number; driver_id?: number;
  driverFirstName?: string; driverLastName?: string;
};
type Driver = { id: number; firstName: string; lastName: string; email: string; inTrip: boolean };
type Vehicle = { id: number; vehicleType: string; status: string; model: string; licensePlate: string; capacitySeats?: number; activeTripId?: number; departurePoint?: string; arrivalPoint?: string; openReports?: { id: number; type: string; message: string; status: string; repairPrice?: number | string }[]; lastRepair?: { type: string; message: string; price: number | string } };

const statusLabels: Record<string, string> = { pending: 'На підтвердженні', confirmed: 'Підтверджено', in_progress: 'У дорозі', completed: 'Завершено', cancelled: 'Скасовано' };
const vehicleStatusLabels: Record<string, string> = { available: 'Доступний', in_trip: 'У дорозі', maintenance: 'На ТО', out_of_service: 'Не експлуатується' };

function tripDate(value?: string) {
  return value ? new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Час не вказано';
}

export function DispatchPendingPage() {
  const [trips, setTrips] = useState<DispatchTrip[]>([]);
  const [scheduled, setScheduled] = useState<DispatchTrip[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selections, setSelections] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      const [tripsResult, scheduledResult, driversResult] = await Promise.all([
        api.get('/trips/dispatch/board', { params: { status: 'pending' } }),
        api.get('/trips/dispatch/board', { params: { status: 'confirmed' } }),
        api.get('/trips/dispatch/drivers'),
      ]);
      setTrips(tripsResult.data);
      setScheduled(scheduledResult.data);
      setDrivers(driversResult.data);
    } catch (reason: any) { setError(reason?.response?.data?.message ?? 'Не вдалося завантажити чергу рейсів.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useAutoRefresh(load);

  const dispatch = async (trip: DispatchTrip, status: 'confirmed' | 'cancelled' | 'in_progress') => {
    const isBus = (trip.vehicleType ?? trip.vehicle_type) !== 'train';
    const driverId = selections[trip.id] ?? trip.driverId ?? trip.driver_id;
    if (status === 'confirmed' && isBus && !driverId) { setError('Для автобуса спочатку оберіть водія.'); return; }
    setBusy(trip.id); setError('');
    try {
      await api.patch(`/trips/${trip.id}/dispatch`, { status, driverId: ['confirmed', 'in_progress'].includes(status) && isBus ? driverId : undefined });
      if (status === 'confirmed') {
        const assignedDriver = drivers.find((driver) => driver.id === driverId);
        setTrips((current) => current.filter((item) => item.id !== trip.id));
        setScheduled((current) => [{
          ...trip,
          status: 'confirmed',
          driverId: isBus ? driverId : undefined,
          driverFirstName: assignedDriver?.firstName ?? trip.driverFirstName,
          driverLastName: assignedDriver?.lastName ?? trip.driverLastName,
        }, ...current.filter((item) => item.id !== trip.id)]);
      }
      await load();
    } catch (reason: any) { setError(reason?.response?.data?.message ?? 'Не вдалося оновити рейс.'); }
    finally { setBusy(null); }
  };

  return <>
    <div className="page-heading"><div><div className="eyebrow">ДИСПЕТЧЕРСЬКА · ЧЕРГА ЗАЯВОК</div><h1>Рейси на підтвердження</h1><p>Перевірте дані заявки, за потреби призначте водія та підтвердьте рейс.</p></div></div>
    {error && <div className="customer-alert danger">{error}</div>}
    {loading && <div className="panel customer-empty">Завантаження заявок…</div>}
    {!loading && !error && trips.length === 0 && <div className="panel customer-empty"><h2>Немає рейсів на підтвердження</h2><p>Нові заявки клієнтів з’являться тут.</p></div>}
    {trips.map((trip) => {
      const vehicleType = trip.vehicleType ?? trip.vehicle_type ?? '';
      const isTrain = vehicleType === 'train';
      const customer = trip.customerFirstName ? `${trip.customerFirstName} ${trip.customerLastName ?? ''}` : trip.customerName ?? trip.customer_name ?? 'Клієнт';
      const from = trip.departurePoint ?? trip.departure_point ?? '—';
      const to = trip.arrivalPoint ?? trip.arrival_point ?? '—';
      const date = trip.departureTime ?? trip.departure_time;
      const stops = trip.routeStops ?? trip.route_stops ?? [];
      const seats = trip.seatNumbers ?? trip.seat_numbers ?? [];
      let trainNumber = trip.notes?.match(/потяга з каталогу: ([^.]+)/i)?.[1];
      return <article className="panel dispatch-card" key={trip.id}>
        <div className="dispatch-card-top"><span className="trip-id">Заявка №{trip.id}</span><span className="trip-status">{statusLabels[trip.status] ?? trip.status}</span></div>
        <h2>{from} <i>→</i> {to}</h2>
        <div className="dispatch-details"><span>Клієнт<strong>{customer}</strong></span><span>Виїзд<strong>{tripDate(date)}</strong></span>{(trip.serviceType ?? trip.service_type) === 'cargo' ? <span>Вантаж<strong>{trip.cargoWeightKg ?? trip.cargo_weight_kg ?? '—'} кг · {trip.cargoDimensions ?? trip.cargo_dimensions ?? 'габарити не вказано'}</strong></span> : <span>Пасажири<strong>{trip.passengerCount ?? trip.passenger_count ?? '—'}</strong></span>}<span>Вартість<strong>{Number(trip.cost).toLocaleString('uk-UA', { minimumFractionDigits: 2 })} грн</strong></span></div>
        {stops.length > 0 && <p className="dispatch-note">Зупинки: {stops.join(' · ')}</p>}
        <p className="dispatch-note">{isTrain ? `Потяг № ${trainNumber ?? '—'} · ${trip.seatType ?? trip.seat_type ?? ''} · місця ${seats.join(', ') || 'не вибрано'}` : `${(trip.serviceType ?? trip.service_type) === 'cargo' ? 'Вантажівка' : 'Автобус'}: ${trip.vehicleModel ?? trip.vehicle_model ?? '—'} · ${trip.licensePlate ?? ''}`}</p>
        <div className="dispatch-actions">{!isTrain && <label className="dispatch-driver-field">Водій<select value={selections[trip.id] ?? trip.driverId ?? trip.driver_id ?? ''} onChange={(event) => setSelections((current) => ({ ...current, [trip.id]: Number(event.target.value) }))}><option value="">Оберіть водія</option>{drivers.map((driver) => <option value={driver.id} key={driver.id} disabled={driver.inTrip}>{driver.firstName} {driver.lastName}{driver.inTrip ? ' · у рейсі' : ''}</option>)}</select></label>}
          <button className="primary-button" disabled={busy === trip.id} onClick={() => void dispatch(trip, 'confirmed')}>{busy === trip.id ? 'Зберігаємо…' : isTrain ? 'Підтвердити рейс' : 'Призначити й підтвердити'}</button><button className="dispatch-reject" disabled={busy === trip.id} onClick={() => void dispatch(trip, 'cancelled')}>Відхилити</button>
        </div>
      </article>;
    })}
    {scheduled.length > 0 && <section className="dispatch-scheduled"><div className="panel-heading"><div><h2>Підтверджені · очікують виїзду</h2><span>Почніть рейс у день відправлення</span></div><span className="step-number">{scheduled.length}</span></div>{scheduled.map((trip) => {
      const vehicleType = trip.vehicleType ?? trip.vehicle_type ?? '';
      const isTrain = vehicleType === 'train';
      return <article className="panel dispatch-card dispatch-scheduled-card" key={trip.id}><div className="dispatch-card-top"><span className="trip-id">Рейс №{trip.id}</span><span className="trip-status scheduled">Підтверджено</span></div><h2>{trip.departurePoint ?? trip.departure_point} <i>→</i> {trip.arrivalPoint ?? trip.arrival_point}</h2><div className="dispatch-details"><span>Виїзд<strong>{tripDate(trip.departureTime ?? trip.departure_time)}</strong></span><span>Транспорт<strong>{isTrain ? `Потяг · ${trip.notes?.match(/потяга з каталогу: ([^.]+)/i)?.[1] ?? ''}` : `${trip.vehicleModel ?? trip.vehicle_model} · ${trip.licensePlate ?? ''}`}</strong></span><span>Водій<strong>{isTrain ? 'Не потрібен' : `${trip.driverFirstName ?? ''} ${trip.driverLastName ?? ''}`}</strong></span></div><div className="dispatch-actions"><button className="primary-button" disabled={busy === trip.id} onClick={() => void dispatch(trip, 'in_progress')}>{busy === trip.id ? 'Зберігаємо…' : 'Почати рейс'}</button></div></article>;
    })}</section>}
  </>;
}

export function DispatchInProgressPage() {
  const [trips, setTrips] = useState<DispatchTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try { const { data } = await api.get('/trips/dispatch/board', { params: { status: 'in_progress' } }); setTrips(data); }
    catch (reason: any) { setError(reason?.response?.data?.message ?? 'Не вдалося завантажити рейси в дорозі.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useAutoRefresh(load);
  return <>
    <div className="page-heading"><div><div className="eyebrow">ДИСПЕТЧЕРСЬКА · ВИКОНАННЯ</div><h1>Рейси у дорозі</h1><p>Активні рейси та призначені водії й транспорт.</p></div></div>
    {error && <div className="customer-alert danger">{error}</div>}{loading && <div className="panel customer-empty">Завантаження рейсів…</div>}
    {!loading && !error && trips.length === 0 && <div className="panel customer-empty"><h2>Зараз немає рейсів у дорозі</h2><p>Підтверджені рейси з’являться тут після початку руху.</p></div>}
    {trips.map((trip) => <article className="panel dispatch-card" key={trip.id}><div className="dispatch-card-top"><span className="trip-id">Рейс №{trip.id}</span><span className="trip-status in_progress">У дорозі</span></div><h2>{trip.departurePoint ?? trip.departure_point} <i>→</i> {trip.arrivalPoint ?? trip.arrival_point}</h2><div className="dispatch-details"><span>Виїзд<strong>{tripDate(trip.departureTime ?? trip.departure_time)}</strong></span><span>Транспорт<strong>{trip.vehicleModel ?? trip.vehicle_model} · {trip.licensePlate}</strong></span><span>Водій<strong>{trip.driverFirstName ? `${trip.driverFirstName} ${trip.driverLastName ?? ''}` : 'Не призначено'}</strong></span><span>Пасажири<strong>{trip.passengerCount ?? trip.passenger_count ?? '—'}</strong></span></div><p className="dispatch-note">Статус рейсу оновлює водій після завершення поїздки.</p></article>)}
  </>;
}

export function DispatchVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try { const { data } = await api.get('/vehicles/dispatch'); setVehicles(data); }
    catch (reason: any) { setError(reason?.response?.data?.message ?? 'Не вдалося завантажити транспорт.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useAutoRefresh(load);
  const setStatus = async (vehicle: Vehicle, status: string) => {
    setBusy(vehicle.id); setError('');
    try { await api.patch(`/vehicles/${vehicle.id}/dispatch-status`, { status }); await load(); }
    catch (reason: any) { setError(reason?.response?.data?.message ?? 'Не вдалося оновити стан транспорту.'); }
    finally { setBusy(null); }
  };
  return <>
    <div className="page-heading"><div><div className="eyebrow">ДИСПЕТЧЕРСЬКА · АВТОПАРК</div><h1>Транспорт і ТО</h1><p>Позначайте транспорт доступним, на техобслуговуванні або виведеним з експлуатації.</p></div></div>
    <div className="customer-info-strip"><span>i</span><p>Транспорт зі статусом «На ТО» чи «Не експлуатується» не пропонуватиметься для нових рейсів. Статус того самого транспорту зможуть бачити водії у своєму майбутньому кабінеті.</p></div>
    {error && <div className="customer-alert danger">{error}</div>}{loading && <div className="panel customer-empty">Завантаження автопарку…</div>}
    <section className="customer-vehicle-grid">{vehicles.map((vehicle) => <article className="panel dispatch-vehicle-card" key={vehicle.id}><div className={`customer-vehicle-icon ${vehicle.vehicleType === 'train' ? 'train' : ''}`}>{vehicle.vehicleType === 'train' ? '🚆' : '🚌'}</div>{!!vehicle.openReports?.length && <span className="vehicle-alert-icon" title={vehicle.openReports.map(report => `${report.type === 'breakdown' ? 'Поломка' : 'Затримка'}: ${report.message}`).join('\n')}>⚠ {vehicle.openReports.length}</span>}<span className={`vehicle-state ${vehicle.status}`}>{vehicleStatusLabels[vehicle.status] ?? vehicle.status}</span><h2>{vehicle.model}</h2><p>{vehicle.licensePlate} · {vehicle.capacitySeats ?? '—'} місць</p>{vehicle.openReports?.map(report => <p className="dispatch-note vehicle-report-note" key={report.id}>{report.type === 'breakdown' ? 'Поломка' : 'Затримка'}: {report.message}{report.repairPrice != null ? ` · ${Number(report.repairPrice).toLocaleString('uk-UA')} грн` : ''}</p>)}{vehicle.lastRepair && <p className="dispatch-note">Останній рахунок: {vehicle.lastRepair.type === 'breakdown' ? 'Поламка' : 'Роботи'} ({vehicle.lastRepair.message}) — {Number(vehicle.lastRepair.price).toLocaleString('uk-UA')} грн</p>}{vehicle.activeTripId && <p className="dispatch-note">Зараз у рейсі: {vehicle.departurePoint} → {vehicle.arrivalPoint}</p>}<label className="dispatch-status-field">Стан транспорту<select value={vehicle.status} disabled={busy === vehicle.id || vehicle.status === 'in_trip'} onChange={(event) => void setStatus(vehicle, event.target.value)}><option value="available">Доступний</option><option value="maintenance">На ТО</option><option value="out_of_service">Не експлуатується</option>{vehicle.status === 'in_trip' && <option value="in_trip">У рейсі</option>}</select></label></article>)}</section>
  </>;
}
