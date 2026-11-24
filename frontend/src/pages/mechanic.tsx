import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { useAutoRefresh } from '../services/use-auto-refresh';

type Report = { id: number; type: 'breakdown' | 'delay'; message: string; status: string; repairPrice?: number | string; createdAt: string; driverName: string };
type Vehicle = { id: number; vehicleType: string; status: string; model: string; licensePlate: string; reports: Report[]; lastRepair?: { message: string; price: number | string; type: string } };
const states: Record<string, string> = { available: 'Доступний', maintenance: 'На ТО', out_of_service: 'Не експлуатується', in_trip: 'У дорозі' };

export function MechanicVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async () => { setError(''); try { const { data } = await api.get('/vehicles/mechanic/board'); setVehicles(data); } catch (reason: any) { setError(reason?.response?.data?.message ?? 'Не вдалося завантажити дані автопарку.'); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  useAutoRefresh(load);
  const changeStatus = async (vehicle: Vehicle, status: string) => { setBusy(`vehicle-${vehicle.id}`); try { await api.patch(`/vehicles/${vehicle.id}/mechanic-status`, { status }); await load(); } catch (reason: any) { setError(reason?.response?.data?.message ?? 'Не вдалося змінити статус.'); } finally { setBusy(null); } };
  const resolve = async (report: Report) => { const message = window.prompt('Що відремонтовано?'); if (!message?.trim()) return; const price = window.prompt('Вартість ремонту, грн:', '0'); if (price === null || !Number.isFinite(Number(price)) || Number(price) < 0) return; setBusy(`report-${report.id}`); try { await api.patch(`/vehicles/reports/${report.id}/resolve`, { message, price: Number(price) }); await load(); } catch (reason: any) { setError(reason?.response?.data?.message ?? 'Не вдалося зберегти ремонт.'); } finally { setBusy(null); } };
  return <>
    <div className="page-heading"><div><div className="eyebrow">КАБІНЕТ МЕХАНІКА</div><h1>Транспорт і ремонти</h1></div></div>
    {error && <div className="customer-alert danger">{error}</div>}{loading && <div className="panel customer-empty">Завантаження автопарку…</div>}
    {!loading && vehicles.length === 0 && <div className="panel customer-empty"><h2>Немає транспорту на обслуговуванні</h2><p>Нові повідомлення водіїв з’являться тут.</p></div>}
    <section className="customer-vehicle-grid">{vehicles.map(vehicle => <article className="panel dispatch-vehicle-card" key={vehicle.id}>
      <div className={`customer-vehicle-icon ${vehicle.vehicleType === 'train' ? 'train' : ''}`}>{vehicle.vehicleType === 'train' ? '🚆' : '🚌'}</div><span className={`vehicle-state ${vehicle.status}`}>{states[vehicle.status] ?? vehicle.status}</span><h2>{vehicle.model}</h2><p>{vehicle.licensePlate}</p>
      {vehicle.lastRepair && <p className="dispatch-note">Останній рахунок: {vehicle.lastRepair.type === 'breakdown' ? 'Поламка' : 'Роботи'} ({vehicle.lastRepair.message}) — {Number(vehicle.lastRepair.price).toLocaleString('uk-UA')} грн</p>}
      {vehicle.reports.map(report => <div className="mechanic-report" key={report.id}><strong>{report.type === 'breakdown' ? 'ПОЛАМКА' : 'ЗАТРИМКА'} ({report.message})</strong><p>{report.driverName} · {new Date(report.createdAt).toLocaleString('uk-UA')}</p>{report.repairPrice != null && <p>Рахунок: {Number(report.repairPrice).toLocaleString('uk-UA')} грн</p>}<button className="primary-button" disabled={busy === `report-${report.id}`} onClick={() => void resolve(report)}>Записати ремонт і закрити</button></div>)}
      <label className="dispatch-status-field">Стан транспорту<select value={vehicle.status} disabled={busy === `vehicle-${vehicle.id}` || vehicle.status === 'in_trip'} onChange={event => void changeStatus(vehicle, event.target.value)}><option value="available">Доступний</option><option value="maintenance">На ТО</option><option value="out_of_service">Не експлуатується</option></select></label>
    </article>)}</section>
  </>;
}
