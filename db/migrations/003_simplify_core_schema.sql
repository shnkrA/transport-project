-- Compact operational schema: users, roles, vehicles, and priced trips.
-- Existing user and vehicle records are retained. Existing trips are copied
-- from the former order/route model before its auxiliary tables are removed.

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS status VARCHAR(50);
-- The migration reads the old lookup tables before dropping them; the IDE's
-- attached datasource points at the final schema instead.
-- noinspection SqlResolve
UPDATE vehicles v
SET vehicle_type = COALESCE(vt.name, 'bus'),
    status = COALESCE(vs.name, 'available')
FROM vehicle_types vt, vehicle_statuses vs
WHERE vt.id = v.type_id AND vs.id = v.status_id;
UPDATE vehicles SET vehicle_type = 'bus' WHERE vehicle_type IS NULL;
UPDATE vehicles SET status = 'available' WHERE status IS NULL;

-- Rename the old table so its records can be translated to the compact model.
-- noinspection SqlResolve
ALTER TABLE trips RENAME TO trips_legacy;

-- noinspection SqlResolve
CREATE TABLE trips (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(200) NOT NULL,
    driver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    departure_point VARCHAR(255) NOT NULL,
    arrival_point VARCHAR(255) NOT NULL,
    departure_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    passenger_count INTEGER,
    cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- noinspection SqlResolve, SqlInsertValues
INSERT INTO trips (
    id, customer_id, customer_name, driver_id, vehicle_id,
    departure_point, arrival_point, departure_time, status,
    passenger_count, cost, notes, created_at, updated_at
)
SELECT t.id, o.created_by, o.customer_name, d.user_id, t.vehicle_id,
       COALESCE(r.departure_point, o.departure_point),
       COALESCE(r.arrival_point, o.arrival_point),
       t.departure_time, COALESCE(ts.name, 'pending'),
       o.passenger_count, COALESCE(o.calculated_price, 0),
       t.notes, COALESCE(t.created_at, NOW()), COALESCE(t.updated_at, NOW())
FROM trips_legacy t
JOIN orders o ON o.id = t.order_id
LEFT JOIN routes r ON r.id = t.route_id
LEFT JOIN drivers d ON d.id = t.driver_id
LEFT JOIN trip_statuses ts ON ts.id = t.status_id;

SELECT setval(pg_get_serial_sequence('trips', 'id'),
              GREATEST(COALESCE((SELECT MAX(id) FROM trips), 0), 1),
              COALESCE((SELECT MAX(id) FROM trips), 0) > 0);

CREATE INDEX idx_trips_customer ON trips(customer_id);
CREATE INDEX idx_core_trips_vehicle ON trips(vehicle_id);
CREATE INDEX idx_core_trips_departure ON trips(departure_time);

ALTER TABLE vehicles ALTER COLUMN vehicle_type SET NOT NULL;
ALTER TABLE vehicles ALTER COLUMN status SET NOT NULL;
-- These are legacy columns removed by this migration, so they are absent from
-- the live datasource that the IDE uses for reference resolution.
-- noinspection SqlResolve
ALTER TABLE vehicles
    DROP COLUMN IF EXISTS type_id,
    DROP COLUMN IF EXISTS status_id,
    DROP COLUMN IF EXISTS vin_number,
    DROP COLUMN IF EXISTS year_manufactured,
    DROP COLUMN IF EXISTS capacity_weight,
    DROP COLUMN IF EXISTS current_mileage,
    DROP COLUMN IF EXISTS fuel_type,
    DROP COLUMN IF EXISTS fuel_consumption_per_100;

-- noinspection SqlResolve
DROP TABLE IF EXISTS
    audit_log,
    document_types,
    documents,
    driver_license_categories,
    drivers,
    fuel_records,
    gps_tracking,
    maintenance_orders,
    maintenance_statuses,
    maintenance_types,
    notifications,
    order_statuses,
    orders,
    payments,
    road_sheets,
    route_checkpoints,
    routes,
    spare_part_usage,
    spare_parts,
    tariff_types,
    tariffs,
    trip_checkpoints,
    trip_statuses,
    trips_legacy,
    vehicle_statuses,
    vehicle_types
CASCADE;

-- Preserve any old mechanic/cashier accounts as ordinary users, then keep the
-- five roles used by the project.
UPDATE users
SET role_id = (SELECT id FROM roles WHERE name = 'user')
WHERE role_id IN (SELECT id FROM roles WHERE name IN ('mechanic', 'cashier'));
DELETE FROM roles WHERE name IN ('mechanic', 'cashier');

-- The application connects as `transport`; grant it runtime access to the
-- compact schema even when this migration is run by the previous owner.
GRANT SELECT, INSERT, UPDATE, DELETE ON roles, users, vehicles, trips TO transport;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO transport;
