-- Ролі доступу для працівників і відкритої реєстрації клієнтів.
INSERT INTO roles (name, description) VALUES
    ('logistician', 'Логіст'),
    ('user', 'Клієнт, який може замовити перевезення')
ON CONFLICT (name) DO NOTHING;

UPDATE roles SET description = 'Диспетчер' WHERE name = 'dispatcher';
UPDATE roles SET description = 'Водій' WHERE name = 'driver';
UPDATE roles SET description = 'Адміністратор системи' WHERE name = 'admin';

INSERT INTO vehicle_types (name, description) VALUES
    ('train', 'Пасажирський залізничний транспорт'),
    ('bus', 'Автобус для пасажирських перевезень')
ON CONFLICT (name) DO NOTHING;

-- Демонстраційні одиниці автопарку. Для залізниці наведені місткості вагонів.
INSERT INTO vehicles (type_id, status_id, model, license_plate, capacity_seats, fuel_type)
SELECT vt.id, vs.id, seed.model, seed.fleet_code, seed.seats, seed.fuel
FROM (VALUES
    ('bus', 'Мікроавтобус, 7 місць', 'DEMO-BUS-007', 7, 'Дизель'),
    ('bus', 'Автобус, 20 місць', 'DEMO-BUS-020', 20, 'Дизель'),
    ('bus', 'Автобус, 40 місць', 'DEMO-BUS-040', 40, 'Дизель'),
    ('train', 'Пасажирський вагон купейний УЗ (36 місць)', 'DEMO-TRAIN-036', 36, NULL),
    ('train', 'Пасажирський вагон плацкартний УЗ (54 місця)', 'DEMO-TRAIN-054', 54, NULL)
) AS seed(type_name, model, fleet_code, seats, fuel)
JOIN vehicle_types vt ON vt.name = seed.type_name
JOIN vehicle_statuses vs ON vs.name = 'available'
ON CONFLICT (license_plate) DO NOTHING;
