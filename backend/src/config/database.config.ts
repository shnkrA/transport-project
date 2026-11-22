import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  type: process.env.DB_TYPE || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  username: process.env.DB_USER || 'transport',
  password: process.env.DB_PASSWORD || 'transport',
  database: process.env.DB_NAME || 'transport_db',
  synchronize: process.env.DB_SYNC === 'true',
}));
