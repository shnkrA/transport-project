import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

const staff = [
  { role: 'admin', firstName: 'Анна', lastName: 'Шинкарь', email: 'admin@transit.demo', password: 'AdminTransit2026!' },
  { role: 'dispatcher', firstName: 'Олена', lastName: 'Кравець', email: 'dispatcher@transit.demo', password: 'DispatchTransit2026!' },
  { role: 'logistician', firstName: 'Ігор', lastName: 'Мельник', email: 'logistics@transit.demo', password: 'LogisticsTransit2026!' },
  { role: 'driver', firstName: 'Олександр', lastName: 'Коваль', email: 'driver@transit.demo', password: 'DriverTransit2026!' },
  { role: 'driver', firstName: 'Ірина', lastName: 'Мельник', email: 'driver2@transit.demo', password: 'Driver2Transit2026!' },
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
      ['logistician', 'Логіст'], ['driver', 'Водій'], ['user', 'Клієнт'],
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
      const [{ id: roleId }] = await this.dataSource.query('SELECT id FROM roles WHERE name = $1', [account.role]);
      const passwordHash = await bcrypt.hash(account.password, 10);
      await this.dataSource.query(
        'INSERT INTO users (role_id, first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4, $5)',
        [roleId, account.firstName, account.lastName, account.email, passwordHash],
      );
    }
  }
}
