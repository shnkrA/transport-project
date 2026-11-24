-- Driver incident reports and mechanic workflow.
INSERT INTO roles (name, description) VALUES ('mechanic', 'Механік') ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'mechanic')
WHERE role_id = (SELECT id FROM roles WHERE name = 'logistician');
DELETE FROM roles WHERE name = 'logistician';

CREATE TABLE IF NOT EXISTS driver_reports (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('breakdown', 'delay')),
  message TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  mechanic_notes TEXT,
  repair_price DECIMAL(12,2),
  mechanic_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_driver_reports_vehicle_status ON driver_reports(vehicle_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON driver_reports TO transport;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE driver_reports_id_seq TO transport;
