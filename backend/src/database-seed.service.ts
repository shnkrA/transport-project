import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

const staff = [
  { role: 'admin', firstName: 'Анна', lastName: 'Шинкарь', email: 'admin@transit.demo', password: 'AdminTransit2026!' },
  { role: 'dispatcher', firstName: 'Олена', lastName: 'Кравець', email: 'dispatcher@transit.demo', password: 'DispatchTransit2026!' },
  { role: 'mechanic', firstName: 'Ігор', lastName: 'Мельник', email: 'mechanic@transit.demo', password: 'MechanicTransit2026!' },
  { role: 'driver', firstName: 'Олександр', lastName: 'Коваль', email: 'oleksandr@transit.demo', password: 'DriverTransit2026!' },
  { role: 'driver', firstName: 'Ірина', lastName: 'Мельник', email: 'iryna@transit.demo', password: 'Driver2Transit2026!' },
  { role: 'driver', firstName: 'Сергій', lastName: 'Бондар', email: 'serhii@transit.demo', password: 'Driver3Transit2026!' },
  { role: 'driver', firstName: 'Марія', lastName: 'Романюк', email: 'maria@transit.demo', password: 'Driver4Transit2026!' },
  { role: 'driver', firstName: 'Андрій', lastName: 'Ткачук', email: 'andrii@transit.demo', password: 'Driver5Transit2026!' },
];

@Injectable()
export class DatabaseSeedService implements OnApplicationBootstrap {
  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    const roles = [
      ['admin', 'Адміністратор'], ['dispatcher', 'Диспетчер'],
      ['mechanic', 'Механік'], ['driver', 'Водій'], ['user', 'Клієнт'],
    ];
    for (const [name, description] of roles) {
      await this.dataSource.query(
        'INSERT INTO roles (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
        [name, description],
      );
    }
    for (const account of staff) {
      const exists = await this.dataSource.query('SELECT id FROM users WHERE email = $1', [account.email]);
      if (exists.length) continue;
      if (account.role === 'driver') {
        const existingDriver = await this.dataSource.query(
          `SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id
           WHERE r.name = 'driver' AND lower(u.first_name) = lower($1) AND lower(u.last_name) = lower($2)
           ORDER BY u.id LIMIT 1`,
          [account.firstName, account.lastName],
        );
        if (existingDriver.length) {
          await this.dataSource.query('UPDATE users SET email = $1 WHERE id = $2', [account.email, existingDriver[0].id]);
          continue;
        }
      }
      const [{ id: roleId }] = await this.dataSource.query('SELECT id FROM roles WHERE name = $1', [account.role]);
      const passwordHash = await bcrypt.hash(account.password, 10);
      await this.dataSource.query(
        'INSERT INTO users (role_id, first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4, $5)',
        [roleId, account.firstName, account.lastName, account.email, passwordHash],
      );
    }

    const trains: { trainNumber: string }[] = await this.dataSource.query(
      'SELECT DISTINCT train_number AS "trainNumber" FROM route_catalog WHERE is_active = TRUE AND train_number IS NOT NULL',
    );
    for (const { trainNumber } of trains) {
      const licensePlate = `TRAIN-${trainNumber.replace(/[^A-Za-z0-9]/g, '')}`;
      await this.dataSource.query(
        `INSERT INTO vehicles (vehicle_type, status, model, license_plate, capacity_seats)
         VALUES ('train', 'available', $1, $2, 54)
         ON CONFLICT (license_plate) DO UPDATE
         SET capacity_seats = COALESCE(vehicles.capacity_seats, EXCLUDED.capacity_seats)`,
        [`Потяг № ${trainNumber}`, licensePlate],
      );
    }

    const trucks = [
      { model: 'Вантажівка MAN TGL', plate: 'CARGO-AA-1042', capacity: 3500 },
      { model: 'Вантажівка Renault Master', plate: 'CARGO-KA-2086', capacity: 1500 },
    ];
    for (const truck of trucks) {
      await this.dataSource.query(
        `INSERT INTO vehicles (vehicle_type, status, model, license_plate, capacity_weight_kg)
         VALUES ('truck', 'available', $1, $2, $3)
         ON CONFLICT (license_plate) DO UPDATE
         SET capacity_weight_kg = EXCLUDED.capacity_weight_kg`,
        [truck.model, truck.plate, truck.capacity],
      );
    }

    const [cargoVehicle] = await this.dataSource.query(
      `SELECT id FROM vehicles
       WHERE vehicle_type = 'truck' AND license_plate = 'CARGO-AA-1042'`,
    );
    const cargoSamples = [
      {
        marker: 'DEMO-CARGO-REQUEST-1',
        customerName: 'ТОВ «Добрий врожай»',
        origin: 'Київ',
        destination: 'Житомир',
        weight: 1200,
        dimensions: '240 × 160 × 140 см',
        cost: 1440,
        days: 3,
        notes: 'Палетований вантаж; DEMO-CARGO-REQUEST-1',
      },
      {
        marker: 'DEMO-CARGO-REQUEST-2',
        customerName: 'Майстерня «Дім і сад»',
        origin: 'Київ',
        destination: 'Чернігів',
        weight: 800,
        dimensions: '180 × 120 × 100 см',
        cost: 960,
        days: 5,
        notes: 'Будівельні матеріали; DEMO-CARGO-REQUEST-2',
      },
    ];
    for (const sample of cargoSamples) {
      const [exists] = await this.dataSource.query(
        'SELECT id FROM trips WHERE notes LIKE $1 LIMIT 1',
        [`%${sample.marker}%`],
      );
      if (!exists) {
        await this.dataSource.query(
          `INSERT INTO trips
             (customer_name, vehicle_id, departure_point, arrival_point, departure_time,
              status, cost, notes, service_type, cargo_weight_kg, cargo_dimensions)
           VALUES ($1, $2, $3, $4, (CURRENT_DATE + $5::int) + TIME '09:00',
                   'pending', $6, $7, 'cargo', $8, $9)`,
          [sample.customerName, cargoVehicle.id, sample.origin, sample.destination,
            sample.days, sample.cost, sample.notes, sample.weight, sample.dimensions],
        );
      }
    }
  }
}
