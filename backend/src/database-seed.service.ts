import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

const staff = [
  { role: 'admin', firstName: 'Анна', lastName: 'Шинкарь', email: 'admin@transit.demo', password: 'AdminTransit2026!' },
  { role: 'dispatcher', firstName: 'Олена', lastName: 'Кравець', email: 'dispatcher@transit.demo', password: 'DispatchTransit2026!' },
  { role: 'logistician', firstName: 'Ігор', lastName: 'Мельник', email: 'logistics@transit.demo', password: 'LogisticsTransit2026!' },
  { role: 'driver', firstName: 'Олександр', lastName: 'Коваль', email: 'driver@transit.demo', password: 'DriverTransit2026!' },
];

@Injectable()
export class DatabaseSeedService implements OnApplicationBootstrap {
  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    const roles = [
      ['admin', 'Адміністратор'], ['dispatcher', 'Диспетчер'],
      ['logistician', 'Логіст'], ['driver', 'Водій'], ['user', 'Клієнт'],
    ];
    for (const [name, description] of roles) {
      await this.dataSource.query(
        'INSERT INTO roles (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
        [name, description],
      );
    }
    const transport = [
      ['bus', 'Мікроавтобус, 7 місць', 'DEMO-BUS-007', 7],
      ['bus', 'Автобус, 20 місць', 'DEMO-BUS-020', 20],
      ['bus', 'Автобус, 40 місць', 'DEMO-BUS-040', 40],
      ['train', 'Пасажирський вагон купейний УЗ (36 місць)', 'DEMO-TRAIN-036', 36],
      ['train', 'Пасажирський вагон плацкартний УЗ (54 місця)', 'DEMO-TRAIN-054', 54],
    ];
    for (const [type, model, code, seats] of transport) {
      await this.dataSource.query(
        `INSERT INTO vehicles (vehicle_type, status, model, license_plate, capacity_seats)
         VALUES ($1, 'available', $2, $3, $4) ON CONFLICT (license_plate) DO NOTHING`,
        [type, model, code, seats],
      );
    }
    for (const account of staff) {
      const exists = await this.dataSource.query('SELECT id FROM users WHERE email = $1', [account.email]);
      if (exists.length) continue;
      const [{ id: roleId }] = await this.dataSource.query('SELECT id FROM roles WHERE name = $1', [account.role]);
      const passwordHash = await bcrypt.hash(account.password, 10);
      await this.dataSource.query(
        'INSERT INTO users (role_id, first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4, $5)',
        [roleId, account.firstName, account.lastName, account.email, passwordHash],
      );
    }
  }
}
