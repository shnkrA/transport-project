import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

type DriverTrip = {
  id: number; status: string; departurePoint: string; arrivalPoint: string; departureTime?: string;
  passengerCount?: number; cost: number | string; notes?: string; routeStops?: string[];
  serviceType?: string; service_type?: string; cargoWeightKg?: number | string; cargo_weight_kg?: number | string;
  cargoDimensions?: string; cargo_dimensions?: string;
  routeDistanceKm?: number | string; vehicleModel: string; licensePlate: string; vehicleStatus: string;
};
const statusLabels: Record<string, string> = { pending: 'Очікує підтвердження', confirmed: 'Підтверджено', in_progress: 'У дорозі', completed: 'Завершено', cancelled: 'Скасовано' };
function tripDate(value?: string) { return value ? new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Час не вказано'; }
function vehicleStatusLabel(value: string) {
  return ({ available: 'Доступний', in_trip: 'У дорозі', maintenance: 'На ТО', out_of_service: 'Не експлуатується' } as Record<string, string>)[value] ?? value;
}

function downloadRoadSheet(trip: DriverTrip) {
  const canvas = document.createElement('canvas'); canvas.width = 1240; canvas.height = 1754;
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#183b75'; ctx.fillRect(0, 0, canvas.width, 210);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 56px Arial'; ctx.fillText('ТРАНЗИТ · ДОРОЖНІЙ ЛИСТ', 80, 115);
  ctx.font = '30px Arial'; ctx.fillText(`Рейс №${trip.id}`, 80, 170);
  const distance = Number(trip.routeDistanceKm) || 0;
  const lines = [
    ['Маршрут', `${trip.departurePoint} → ${trip.arrivalPoint}`], ['Дата та час виїзду', tripDate(trip.departureTime)],
    ['Транспорт', `${trip.vehicleModel} · ${trip.licensePlate}`],
    ...((trip.serviceType ?? trip.service_type) === 'cargo'
      ? [['Вантаж', `${trip.cargoWeightKg ?? trip.cargo_weight_kg ?? '—'} кг · ${trip.cargoDimensions ?? trip.cargo_dimensions ?? 'габарити не вказано'}`]]
      : [['Пасажири', String(trip.passengerCount ?? '—')]]),
    ['Відстань за маршрутом', distance ? `${distance.toLocaleString('uk-UA')} км` : 'Не вказано'],
    ['Орієнтовне пальне', distance ? `${(distance * 0.25).toLocaleString('uk-UA', { maximumFractionDigits: 1 })} л (25 л/100 км)` : 'Не розраховано'],
    ['Вартість рейсу', `${Number(trip.cost).toLocaleString('uk-UA')} грн`],
  ];
  let y = 310;
  for (const [label, value] of lines) {
    ctx.fillStyle = '#77859a'; ctx.font = 'bold 25px Arial'; ctx.fillText(label.toLocaleUpperCase('uk-UA'), 80, y);
    ctx.fillStyle = '#182b48'; ctx.font = '34px Arial';
    const words = value.split(' '); let row = ''; let rowY = y + 48;
    for (const word of words) { const next = row ? `${row} ${word}` : word; if (ctx.measureText(next).width > 1060 && row) { ctx.fillText(row, 80, rowY); row = word; rowY += 42; } else row = next; }
    ctx.fillText(row, 80, rowY); y = rowY + 76; ctx.strokeStyle = '#e5ebf3'; ctx.beginPath(); ctx.moveTo(80, y - 24); ctx.lineTo(1160, y - 24); ctx.stroke();
  }
  ctx.fillStyle = '#77859a'; ctx.font = '22px Arial'; ctx.fillText('Розрахункова витрата пального є орієнтовною.', 80, 1640);
  const base64 = canvas.toDataURL('image/jpeg', 0.92).split(',')[1];
  const image = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
  const encoder = new TextEncoder(); const chunks: Uint8Array[] = []; let offset = 0; const offsets: number[] = [0];
  const append = (part: Uint8Array | string) => { const bytes = typeof part === 'string' ? encoder.encode(part) : part; chunks.push(bytes); offset += bytes.length; };
  append('%PDF-1.4\n');
  const object = (id: number, body: string, stream?: Uint8Array) => { offsets[id] = offset; append(`${id} 0 obj\n${body}${stream ? `\nstream\n` : ''}`); if (stream) { append(stream); append('\nendstream'); } append('\nendobj\n'); };
  object(1, '<< /Type /Catalog /Pages 2 0 R >>'); object(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  object(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
  object(4, `<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>`, image);
  const content = encoder.encode('q\n595 0 0 842 0 0 cm\n/Im0 Do\nQ'); object(5, `<< /Length ${content.length} >>`, content);
  const xref = offset; append(`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(pos => `${String(pos).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  const blob = new Blob(chunks.map(chunk => chunk.slice().buffer as ArrayBuffer), { type: 'application/pdf' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `dorozhniy-lyst-${trip.id}.pdf`; link.click(); URL.revokeObjectURL(url);
}

export function DriverTripsPage() {
  const [trips, setTrips] = useState<DriverTrip[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [busy, setBusy] = useState<number | null>(null);
  const load = useCallback(async () => { setError(''); try { const { data } = await api.get('/trips/driver/mine'); setTrips(data); } catch (reason: any) { setError(reason?.response?.data?.message ?? 'Не вдалося завантажити ваші рейси.'); } finally { setLoading(false); } }, []);
  useEffect(() => {
    void load();
    const interval = window.setInterval(() => { if (document.visibilityState === 'visible') void load(); }, 5000);
    const onFocus = () => void load();
    window.addEventListener('focus', onFocus);
    return () => { window.clearInterval(interval); window.removeEventListener('focus', onFocus); };
  }, [load]);
  const updateStatus = async (trip: DriverTrip, status: string) => { setBusy(trip.id); setError(''); try { await api.patch(`/trips/${trip.id}/driver-status`, { status }); await load(); } catch (reason: any) { setError(reason?.response?.data?.message ?? 'Не вдалося оновити рейс.'); } finally { setBusy(null); } };
  const report = async (trip: DriverTrip) => { const message = window.prompt('Що саме зламалося?'); if (message === null) return; setBusy(trip.id); setError(''); try { await api.post(`/trips/${trip.id}/report`, { type: 'breakdown', message }); await load(); } catch (reason: any) { setError(reason?.response?.data?.message ?? 'Не вдалося надіслати повідомлення.'); } finally { setBusy(null); } };
  return <>
    <div className="page-heading"><div><div className="eyebrow">КАБІНЕТ ВОДІЯ</div><h1>Мої рейси</h1><p>Призначені диспетчером автобусні рейси та дорожні листи.</p></div></div>
    {error && <div className="customer-alert danger">{error}</div>}{loading && <div className="panel customer-empty">Завантаження рейсів…</div>}
    {!loading && !error && trips.length === 0 && <div className="panel customer-empty"><h2>Призначених рейсів поки немає</h2><p>Коли диспетчер призначить вам рейс, він з’явиться тут.</p></div>}
    {trips.map((trip) => <article className="panel dispatch-card" key={trip.id}>
      <div className="dispatch-card-top"><span className="trip-id">Рейс №{trip.id}</span><span className={`trip-status ${trip.status}`}>{statusLabels[trip.status] ?? trip.status}</span></div>
      <h2>{trip.departurePoint} <i>→</i> {trip.arrivalPoint}</h2>
      <div className="dispatch-details"><span>Виїзд<strong>{tripDate(trip.departureTime)}</strong></span><span>{(trip.serviceType ?? trip.service_type) === 'cargo' ? 'Вантажівка' : 'Автобус'}<strong>{trip.vehicleModel} · {trip.licensePlate}</strong></span>{(trip.serviceType ?? trip.service_type) === 'cargo' ? <span>Вантаж<strong>{trip.cargoWeightKg ?? trip.cargo_weight_kg ?? '—'} кг · {trip.cargoDimensions ?? trip.cargo_dimensions ?? 'габарити не вказано'}</strong></span> : <span>Пасажири<strong>{trip.passengerCount ?? '—'}</strong></span>}<span>Стан транспорту<strong>{vehicleStatusLabel(trip.vehicleStatus)}</strong></span></div>
      {trip.status === 'confirmed' && <p className="dispatch-note">Диспетчер підтвердив цей рейс. Можна розпочинати поїздку.</p>}
      {!!trip.routeStops?.length && <p className="dispatch-note">Зупинки: {trip.routeStops.join(' · ')}</p>}
      {trip.status !== 'confirmed' && !trip.routeStops?.length && trip.notes && !trip.notes.includes('Попередня пропозиція рейсу') && <p className="dispatch-note">{trip.notes}</p>}
      <div className="dispatch-actions"><button className="dispatch-reject" onClick={() => downloadRoadSheet(trip)}>Завантажити дорожній лист PDF</button>
        {trip.status === 'confirmed' && <button className="primary-button" disabled={busy === trip.id} onClick={() => void updateStatus(trip, 'in_progress')}>Почати рейс</button>}
        {trip.status === 'in_progress' && <><button className="primary-button" disabled={busy === trip.id} onClick={() => void updateStatus(trip, 'completed')}>Завершити рейс</button><button className="dispatch-reject" disabled={busy === trip.id} onClick={() => void report(trip)}>Повідомити про поломку</button></>}
      </div>
    </article>)}
  </>;
}
