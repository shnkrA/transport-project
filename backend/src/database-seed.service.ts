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
      ['mechanic', 'Механік'], ['cashier', 'Касир'],
    ];
    for (const [name, description] of roles) {
      await this.dataSource.query(
        'INSERT INTO roles (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
        [name, description],
      );
    }
    await this.dataSource.query(
      "INSERT INTO vehicle_types (name, description) VALUES ('train', 'Пасажирський залізничний транспорт') ON CONFLICT (name) DO NOTHING",
    );
    const transport = [
      ['bus', 'Мікроавтобус, 7 місць', 'DEMO-BUS-007', 7, 'Дизель'],
      ['bus', 'Автобус, 20 місць', 'DEMO-BUS-020', 20, 'Дизель'],
      ['bus', 'Автобус, 40 місць', 'DEMO-BUS-040', 40, 'Дизель'],
      ['train', 'Пасажирський вагон купейний УЗ (36 місць)', 'DEMO-TRAIN-036', 36, null],
      ['train', 'Пасажирський вагон плацкартний УЗ (54 місця)', 'DEMO-TRAIN-054', 54, null],
    ];
    for (const [type, model, code, seats, fuel] of transport) {
      await this.dataSource.query(
        `INSERT INTO vehicles (type_id, status_id, model, license_plate, capacity_seats, fuel_type)
         SELECT vt.id, vs.id, $2, $3, $4, $5 FROM vehicle_types vt, vehicle_statuses vs
         WHERE vt.name = $1 AND vs.name = 'available' ON CONFLICT (license_plate) DO NOTHING`,
        [type, model, code, seats, fuel],
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
