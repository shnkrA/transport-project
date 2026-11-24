-- Rename the former logistics demo account for the mechanic role.
UPDATE users AS mechanic
SET email = 'mechanic@transit.demo'
WHERE lower(mechanic.email) = 'logistics@transit.demo'
  AND NOT EXISTS (
    SELECT 1 FROM users AS existing
    WHERE lower(existing.email) = 'mechanic@transit.demo' AND existing.id <> mechanic.id
  );
