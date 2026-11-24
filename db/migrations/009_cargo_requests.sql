-- Support customer cargo requests in the existing trips workflow.
ALTER TABLE trips
    ADD COLUMN IF NOT EXISTS service_type VARCHAR(20) NOT NULL DEFAULT 'passenger',
    ADD COLUMN IF NOT EXISTS cargo_weight_kg DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS cargo_dimensions VARCHAR(120);

ALTER TABLE vehicles
    ADD COLUMN IF NOT EXISTS capacity_weight_kg DECIMAL(10, 2);

GRANT SELECT, INSERT, UPDATE, DELETE ON trips, vehicles TO transport;
