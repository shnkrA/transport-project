import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

const staff = [
  { role: 'admin', firstName: 'Анна', lastName: 'Шинкарь', email: 'admin@transit.demo', password: 'AdminTransit2026!' },
  { role: 'dispatcher', firstName: 'Олена', lastName: 'Кравець', email: 'dispatcher@transit.demo', password: 'DispatchTransit2026!' },
  { role: 'mechanic', firstName: 'Ігор', lastName: 'Мельник', email: 'mechanic@transit.demo', password: 'MechanicTransit2026!' },
  { role: 'driver', firstName: 'Олександр', lastName: 'Коваль', email: 'driver@transit.demo', password: 'DriverTransit2026!' },
  { role: 'driver', firstName: 'Ірина', lastName: 'Мельник', email: 'iryna@transit.demo', password: 'Driver2Transit2026!' },
  { role: 'driver', firstName: 'Сергій', lastName: 'Бондар', email: 'driver3@transit.demo', password: 'Driver3Transit2026!' },
  { role: 'driver', firstName: 'Марія', lastName: 'Романюк', email: 'driver4@transit.demo', password: 'Driver4Transit2026!' },
  { role: 'driver', firstName: 'Андрій', lastName: 'Ткачук', email: 'driver5@transit.demo', password: 'Driver5Transit2026!' },
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
      if (account.email === 'iryna@transit.demo') {
        const legacyIryna = await this.dataSource.query(
          'SELECT id FROM users WHERE email = $1 AND first_name = $2 AND last_name = $3',
          ['driver2@transit.demo', account.firstName, account.lastName],
        );
        if (legacyIryna.length) {
          await this.dataSource.query('UPDATE users SET email = $1 WHERE id = $2', [account.email, legacyIryna[0].id]);
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
  }
}
