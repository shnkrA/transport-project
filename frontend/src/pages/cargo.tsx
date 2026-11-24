import { FormEvent, useEffect, useState } from 'react';
import { getCurrentUser } from '../services/session';
import api from '../services/api';

type Truck = { id: number; model: string; licensePlate: string; capacityWeightKg?: number | string };

export function CustomerCargoPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [truckId, setTruckId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/vehicles')
      .then(({ data }) => {
        const available = (Array.isArray(data) ? data : []).filter((vehicle: any) => vehicle.vehicleType === 'truck' && vehicle.status === 'available');
        setTrucks(available);
        if (available[0]) setTruckId(String(available[0].id));
      })
      .catch(() => setError('Не вдалося завантажити вантажний транспорт.'))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const weight = Number(form.get('weight'));
    const selectedTruck = trucks.find((truck) => String(truck.id) === truckId);
    if (!selectedTruck) { setError('Наразі немає доступної вантажівки.'); setBusy(false); return; }
    if (selectedTruck.capacityWeightKg && weight > Number(selectedTruck.capacityWeightKg)) {
      setError('Вага вантажу перевищує вантажопідйомність обраного автомобіля.'); setBusy(false); return;
    }
    const user = getCurrentUser();
    try {
      await api.post('/trips', {
        customerId: user?.id,
        customerName: `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Клієнт',
        vehicleId: selectedTruck.id,
        departurePoint: form.get('origin'),
        arrivalPoint: form.get('destination'),
        departureTime: new Date(String(form.get('date'))).toISOString(),
        status: 'pending',
        serviceType: 'cargo',
        cargoWeightKg: weight,
        cargoDimensions: form.get('dimensions'),
        cost: Math.round(weight * 1.2 * 100) / 100,
        notes: String(form.get('description') ?? '').trim(),
      });
      setMessage('Заявку на вантажне перевезення надіслано диспетчеру.');
      formElement.reset();
    } catch (reason: any) {
      setError(reason?.response?.data?.message ?? 'Не вдалося надіслати заявку.');
    } finally { setBusy(false); }
  };

  return <>
    <div className="page-heading"><div><div className="eyebrow">ЗАМОВЛЕННЯ ПЕРЕВЕЗЕННЯ</div><h1>Вантажні перевезення</h1><p>Укажіть маршрут і характеристики вантажу, щоб створити заявку для диспетчера.</p></div></div>
    <form className="panel customer-search-form" onSubmit={submit}>
      <div className="panel-heading"><div><h2>Нова вантажна заявка</h2><span>Вартість попередня, диспетчер підтвердить деталі</span></div><span className="step-number">01</span></div>
      <div className="customer-search-fields">
        <div className="customer-field"><label htmlFor="cargo-origin">Звідки</label><input id="cargo-origin" name="origin" required minLength={2} /></div>
        <div className="customer-field"><label htmlFor="cargo-destination">Куди</label><input id="cargo-destination" name="destination" required minLength={2} /></div>
        <div className="customer-field"><label htmlFor="cargo-date">Бажана дата</label><input id="cargo-date" name="date" type="date" min={new Date().toISOString().slice(0, 10)} required /></div>
        <div className="customer-field"><label htmlFor="cargo-weight">Вага, кг</label><input id="cargo-weight" name="weight" type="number" min="1" step="0.1" required /></div>
        <div className="customer-field"><label htmlFor="cargo-dimensions">Габарити, Д × Ш × В, см</label><input id="cargo-dimensions" name="dimensions" placeholder="120 × 80 × 100" required /></div>
        <div className="customer-field"><label htmlFor="cargo-truck">Вантажівка</label><select id="cargo-truck" value={truckId} onChange={(event) => setTruckId(event.target.value)} disabled={loading || !trucks.length} required><option value="">{loading ? 'Завантаження…' : 'Оберіть автомобіль'}</option>{trucks.map((truck) => <option key={truck.id} value={truck.id}>{truck.model} · до {Number(truck.capacityWeightKg ?? 0).toLocaleString('uk-UA')} кг</option>)}</select></div>
      </div>
      <div className="customer-field"><label htmlFor="cargo-description">Опис вантажу</label><textarea id="cargo-description" name="description" rows={3} placeholder="Що потрібно перевезти, особливі умови" /></div>
      <p className="customer-disclaimer">Попередня оцінка: 1,20 грн за кілограм. Остаточну вартість і дату підтверджує диспетчер.</p>
      {error && <div className="customer-alert danger">{error}</div>}
      {message && <div className="customer-alert success">{message}</div>}
      {!loading && trucks.length === 0 && <div className="customer-alert info">Зараз немає доступних вантажівок.</div>}
      <button className="primary-button customer-submit" disabled={busy || loading || trucks.length === 0}>{busy ? 'Надсилаємо…' : 'Надіслати заявку'}</button>
    </form>
  </>;
}
