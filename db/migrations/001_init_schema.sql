-- ==========================================
-- Транспортне підприємство (ТП)
-- Схема бази даних PostgreSQL
-- ==========================================

-- ==========================================
-- 1. Користувачі та ролі
-- ==========================================

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,  -- admin, dispatcher, driver, mechanic, cashier
    description TEXT
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);

-- ==========================================
-- 2. Транспортні засоби (ТЗ)
-- ==========================================

CREATE TABLE vehicle_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,  -- bus, truck
    description TEXT
);

CREATE TABLE vehicle_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,  -- available, in_trip, in_repair, out_of_service
    color_code VARCHAR(7) DEFAULT '#000000'
);

CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    type_id INTEGER NOT NULL REFERENCES vehicle_types(id) ON DELETE RESTRICT,
    status_id INTEGER NOT NULL REFERENCES vehicle_statuses(id) ON DELETE RESTRICT,
    model VARCHAR(100) NOT NULL,
    license_plate VARCHAR(20) NOT NULL UNIQUE,
    vin_number VARCHAR(17) UNIQUE,
    year_manufactured SMALLINT,
    capacity_weight DECIMAL(10,2),       -- вантажність (кг) для вантажівок
    capacity_seats INTEGER,              -- кількість місць для автобусів
    current_mileage DECIMAL(12,2) DEFAULT 0,
    fuel_type VARCHAR(50),              -- дизель, бензин, газ
    fuel_consumption_per_100 DECIMAL(5,2), -- літрів на 100 км
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);
CREATE INDEX idx_vehicles_status_id ON vehicles(status_id);

-- ==========================================
-- 3. Водії
-- ==========================================

CREATE TABLE driver_license_categories (
    id SERIAL PRIMARY KEY,
    category VARCHAR(10) NOT NULL UNIQUE,  -- B, C, D, CE, DE
    description TEXT
);

CREATE TABLE drivers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(50) NOT NULL UNIQUE,
    license_category_id INTEGER REFERENCES driver_license_categories(id) ON DELETE SET NULL,
    license_issue_date DATE,
    license_expiry_date DATE,
    employment_date DATE,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_drivers_user_id ON drivers(user_id);

-- ==========================================
-- 4. Маршрути та контрольні точки
-- ==========================================

CREATE TABLE routes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    departure_point VARCHAR(255) NOT NULL,
    arrival_point VARCHAR(255) NOT NULL,
    distance_km DECIMAL(10,2) NOT NULL,
    estimated_time_minutes INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE route_checkpoints (
    id SERIAL PRIMARY KEY,
    route_id INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    order_index INTEGER NOT NULL,
    expected_arrival_offset_minutes INTEGER  -- відносно початку маршруту
);

CREATE INDEX idx_checkpoints_route_id ON route_checkpoints(route_id);

-- ==========================================
-- 5. Тарифи
-- ==========================================

CREATE TABLE tariff_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,  -- cargo, passenger
    description TEXT
);

CREATE TABLE tariffs (
    id SERIAL PRIMARY KEY,
    type_id INTEGER NOT NULL REFERENCES tariff_types(id) ON DELETE RESTRICT,
    route_id INTEGER REFERENCES routes(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    price_per_km DECIMAL(10,2),
    price_per_kg DECIMAL(10,2),
    price_per_seat DECIMAL(10,2),
    base_price DECIMAL(10,2) DEFAULT 0,
    valid_from DATE NOT NULL,
    valid_to DATE,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_tariffs_valid ON tariffs(valid_from, valid_to);

-- ==========================================
-- 6. Замовлення
-- ==========================================

CREATE TABLE order_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,  -- pending, confirmed, cancelled, completed
    color_code VARCHAR(7) DEFAULT '#000000'
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    status_id INTEGER NOT NULL REFERENCES order_statuses(id) ON DELETE RESTRICT,
    type_id INTEGER NOT NULL REFERENCES tariff_types(id) ON DELETE RESTRICT,
    customer_name VARCHAR(200) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    departure_point VARCHAR(255) NOT NULL,
    arrival_point VARCHAR(255) NOT NULL,
    departure_date TIMESTAMP WITH TIME ZONE NOT NULL,
    cargo_weight DECIMAL(10,2),
    cargo_dimensions TEXT,  -- довжина×ширина×висота
    passenger_count INTEGER,
    calculated_price DECIMAL(12,2),
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_status ON orders(status_id);
CREATE INDEX idx_orders_date ON orders(departure_date);

-- ==========================================
-- 7. Рейси
-- ==========================================

CREATE TABLE trip_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,  -- formed, road_sheet_issued, in_progress, completed, cancelled
    color_code VARCHAR(7) DEFAULT '#000000'
);

CREATE TABLE trips (
    id SERIAL PRIMARY KEY,
    status_id INTEGER NOT NULL REFERENCES trip_statuses(id) ON DELETE RESTRICT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    route_id INTEGER REFERENCES routes(id) ON DELETE SET NULL,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
    departure_time TIMESTAMP WITH TIME ZONE,
    arrival_time TIMESTAMP WITH TIME ZONE,
    actual_distance_km DECIMAL(10,2),
    fuel_spent_liters DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_trips_status ON trips(status_id);
CREATE INDEX idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX idx_trips_driver ON trips(driver_id);
CREATE INDEX idx_trips_order ON trips(order_id);

-- ==========================================
-- 8. Дорожні листи
-- ==========================================

CREATE TABLE road_sheets (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    sheet_number VARCHAR(50) NOT NULL UNIQUE,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    issued_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    closed_at TIMESTAMP WITH TIME ZONE,
    initial_fuel_level DECIMAL(5,2),
    final_fuel_level DECIMAL(5,2),
    initial_mileage DECIMAL(12,2),
    final_mileage DECIMAL(12,2)
);

-- ==========================================
-- 9. Технічне обслуговування (ТО) та ремонти
-- ==========================================

CREATE TABLE maintenance_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,  -- to, repair, inspection
    description TEXT
);

CREATE TABLE maintenance_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,  -- scheduled, in_progress, completed, cancelled
    color_code VARCHAR(7) DEFAULT '#000000'
);

CREATE TABLE maintenance_orders (
    id SERIAL PRIMARY KEY,
    type_id INTEGER NOT NULL REFERENCES maintenance_types(id) ON DELETE RESTRICT,
    status_id INTEGER NOT NULL REFERENCES maintenance_statuses(id) ON DELETE RESTRICT,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    mechanic_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    description TEXT,
    scheduled_date DATE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cost DECIMAL(12,2),
    mileage_at_service DECIMAL(12,2),
    next_service_mileage DECIMAL(12,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_maintenance_vehicle ON maintenance_orders(vehicle_id);
CREATE INDEX idx_maintenance_status ON maintenance_orders(status_id);

-- ==========================================
-- 10. Склад запчастин
-- ==========================================

CREATE TABLE spare_parts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    article_number VARCHAR(100),
    category VARCHAR(100),
    unit_price DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    min_stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE spare_part_usage (
    id SERIAL PRIMARY KEY,
    maintenance_order_id INTEGER NOT NULL REFERENCES maintenance_orders(id) ON DELETE CASCADE,
    spare_part_id INTEGER NOT NULL REFERENCES spare_parts(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 11. GPS-трекінг
-- ==========================================

CREATE TABLE gps_tracking (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    speed_kmh DECIMAL(5,2),
    heading DECIMAL(5,2),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_gps_vehicle ON gps_tracking(vehicle_id);
CREATE INDEX idx_gps_time ON gps_tracking(recorded_at);

-- ==========================================
-- 12. Контрольні точки рейсу
-- ==========================================

CREATE TABLE trip_checkpoints (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    checkpoint_id INTEGER NOT NULL REFERENCES route_checkpoints(id) ON DELETE RESTRICT,
    passed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- ==========================================
-- 13. Витрати палива
-- ==========================================

CREATE TABLE fuel_records (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
    liters DECIMAL(10,2) NOT NULL,
    price_per_liter DECIMAL(10,2),
    total_cost DECIMAL(12,2),
    mileage_at_refuel DECIMAL(12,2),
    refuel_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    receipt_number VARCHAR(100)
);

CREATE INDEX idx_fuel_vehicle ON fuel_records(vehicle_id);

-- ==========================================
-- 14. Документи
-- ==========================================

CREATE TABLE document_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,  -- ttn, contract, invoice, act, check, manifest, parts_writeoff
    description TEXT
);

CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    type_id INTEGER NOT NULL REFERENCES document_types(id) ON DELETE RESTRICT,
    trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    maintenance_order_id INTEGER REFERENCES maintenance_orders(id) ON DELETE SET NULL,
    document_number VARCHAR(100) NOT NULL UNIQUE,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    issued_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    file_path TEXT,
    notes TEXT
);

CREATE INDEX idx_documents_type ON documents(type_id);
CREATE INDEX idx_documents_trip ON documents(trip_id);

-- ==========================================
-- 15. Оплата
-- ==========================================

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50),  -- cash, card, bank_transfer
    paid_by INTEGER REFERENCES users(id) ON DELETE SET NULL,  -- касир
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    receipt_document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL
);

-- ==========================================
-- 16. Журнал дій (аудит)
-- ==========================================

CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,  -- order, trip, vehicle, tariff, document
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_time ON audit_log(created_at);

-- ==========================================
-- 17. Сповіщення
-- ==========================================

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_entity_type VARCHAR(50),
    related_entity_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- ==========================================
-- Seed data — початкові дані
-- ==========================================

-- Ролі
INSERT INTO roles (name, description) VALUES
    ('admin', 'Адміністратор системи'),
    ('dispatcher', 'Диспетчер (логіст)'),
    ('driver', 'Водій'),
    ('mechanic', 'Механік'),
    ('cashier', 'Касир');

-- Типи ТЗ
INSERT INTO vehicle_types (name, description) VALUES
    ('bus', 'Автобус'),
    ('truck', 'Вантажівка');

-- Статуси ТЗ
INSERT INTO vehicle_statuses (name, color_code) VALUES
    ('available', '#4CAF50'),
    ('in_trip', '#2196F3'),
    ('in_repair', '#FF9800'),
    ('out_of_service', '#F44336');

-- Категорії прав
INSERT INTO driver_license_categories (category, description) VALUES
    ('B', 'Легковий автомобіль'),
    ('C', 'Вантажний автомобіль'),
    ('D', 'Автобус'),
    ('CE', 'Вантажний з причепом'),
    ('DE', 'Автобус з причепом');

-- Типи тарифів
INSERT INTO tariff_types (name, description) VALUES
    ('cargo', 'Вантажні перевезення'),
    ('passenger', 'Пасажирські перевезення');

-- Статуси замовлень
INSERT INTO order_statuses (name, color_code) VALUES
    ('pending', '#FF9800'),
    ('confirmed', '#2196F3'),
    ('cancelled', '#F44336'),
    ('completed', '#4CAF50');

-- Статуси рейсів
INSERT INTO trip_statuses (name, color_code) VALUES
    ('formed', '#9C27B0'),
    ('road_sheet_issued', '#2196F3'),
    ('in_progress', '#FF9800'),
    ('completed', '#4CAF50'),
    ('cancelled', '#F44336');

-- Типи ТО
INSERT INTO maintenance_types (name, description) VALUES
    ('to', 'Технічне обслуговування'),
    ('repair', 'Ремонт'),
    ('inspection', 'Передрейсовий огляд');

-- Статуси ТО
INSERT INTO maintenance_statuses (name, color_code) VALUES
    ('scheduled', '#9E9E9E'),
    ('in_progress', '#FF9800'),
    ('completed', '#4CAF50'),
    ('cancelled', '#F44336');

-- Типи документів
INSERT INTO document_types (name, description) VALUES
    ('ttn', 'Товарно-транспортна накладна (ТТН)'),
    ('contract', 'Договір'),
    ('invoice', 'Рахунок на оплату'),
    ('act', 'Акт виконаних робіт'),
    ('check', 'Чек'),
    ('manifest', 'Посадкова відомість'),
    ('parts_writeoff', 'Накладна на списання запчастин');
