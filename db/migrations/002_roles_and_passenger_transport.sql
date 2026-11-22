-- Add the application roles used by the compact schema.
INSERT INTO roles (name, description) VALUES
    ('logistician', 'Логіст'),
    ('user', 'Клієнт, який може замовити перевезення')
ON CONFLICT (name) DO NOTHING;

UPDATE roles SET description = 'Диспетчер' WHERE name = 'dispatcher';
UPDATE roles SET description = 'Водій' WHERE name = 'driver';
UPDATE roles SET description = 'Адміністратор системи' WHERE name = 'admin';

-- Demo vehicles are seeded by the backend using the final compact schema.
