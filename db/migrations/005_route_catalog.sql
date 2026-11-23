-- Seed route templates used for customer trip suggestions.
-- Train numbers are a snapshot from the official UZ route/timetable pages;
-- dates, times, seats, and fares must be reconfirmed before travel.
CREATE TABLE IF NOT EXISTS route_catalog (
    id SERIAL PRIMARY KEY,
    origin VARCHAR(120) NOT NULL,
    destination VARCHAR(120) NOT NULL,
    transport_type VARCHAR(20) NOT NULL CHECK (transport_type IN ('bus', 'train')),
    distance_km INTEGER NOT NULL CHECK (distance_km > 0),
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    train_number VARCHAR(20),
    departure_time TIME NOT NULL DEFAULT '08:00',
    source_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT route_catalog_unique UNIQUE (origin, destination, transport_type)
);

INSERT INTO route_catalog
    (origin, destination, transport_type, distance_km, duration_minutes, train_number, departure_time, source_url)
VALUES
    ('Київ', 'Львів', 'bus', 540, 480, NULL, '08:00', NULL),
    ('Львів', 'Київ', 'bus', 540, 480, NULL, '08:00', NULL),
    ('Київ', 'Львів', 'train', 540, 420, '063', '20:00', 'https://uz-vezemo.uz.gov.ua/'),
    ('Львів', 'Київ', 'train', 540, 420, '063', '20:00', 'https://uz-vezemo.uz.gov.ua/'),
    ('Київ', 'Харків', 'bus', 480, 420, NULL, '08:00', NULL),
    ('Харків', 'Київ', 'bus', 480, 420, NULL, '08:00', NULL),
    ('Київ', 'Харків', 'train', 480, 300, '724К', '16:00', 'https://booking.uz.gov.ua/schedule/'),
    ('Харків', 'Київ', 'train', 480, 300, '064', '10:41', 'https://uz-vezemo.uz.gov.ua/'),
    ('Київ', 'Запоріжжя', 'bus', 560, 480, NULL, '08:00', NULL),
    ('Запоріжжя', 'Київ', 'bus', 560, 480, NULL, '08:00', NULL),
    ('Київ', 'Запоріжжя', 'train', 560, 540, '032', '19:16', 'https://uz-vezemo.uz.gov.ua/'),
    ('Запоріжжя', 'Київ', 'train', 560, 540, '032', '13:50', 'https://uz-vezemo.uz.gov.ua/'),
    ('Київ', 'Одеса', 'bus', 475, 390, NULL, '08:00', NULL),
    ('Одеса', 'Київ', 'bus', 475, 390, NULL, '08:00', NULL),
    ('Київ', 'Одеса', 'train', 475, 510, '763К', '14:34', 'https://booking.uz.gov.ua/schedule/'),
    ('Одеса', 'Київ', 'train', 475, 510, '763К', '14:34', 'https://booking.uz.gov.ua/schedule/'),
    ('Київ', 'Дніпро', 'bus', 480, 390, NULL, '08:00', NULL),
    ('Дніпро', 'Київ', 'bus', 480, 390, NULL, '08:00', NULL),
    ('Київ', 'Дніпро', 'train', 480, 420, '120', '21:52', 'https://uz-vezemo.uz.gov.ua/'),
    ('Дніпро', 'Київ', 'train', 480, 420, '120', '06:33', 'https://uz-vezemo.uz.gov.ua/')
ON CONFLICT (origin, destination, transport_type) DO UPDATE SET
    distance_km = EXCLUDED.distance_km,
    duration_minutes = EXCLUDED.duration_minutes,
    train_number = EXCLUDED.train_number,
    departure_time = EXCLUDED.departure_time,
    source_url = EXCLUDED.source_url,
    is_active = TRUE;

GRANT SELECT ON route_catalog TO transport;
GRANT USAGE, SELECT ON SEQUENCE route_catalog_id_seq TO transport;
