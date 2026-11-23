-- Fields used by customer route calculation and passenger seat selection.
ALTER TABLE trips
    ADD COLUMN IF NOT EXISTS route_stops JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS route_distance_km DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS seat_type VARCHAR(30),
    ADD COLUMN IF NOT EXISTS seat_numbers JSONB;

GRANT SELECT, INSERT, UPDATE, DELETE ON trips TO transport;
