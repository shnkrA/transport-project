import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { DataSource } from 'typeorm';

export type SessionUser = { id: number; roleId: number; role: string };

@Injectable()
export class SessionService {
  private schemaReady?: Promise<void>;

  constructor(private readonly dataSource: DataSource) {}

  private async ensureTable() {
    if (!this.schemaReady) {
      this.schemaReady = this.dataSource.query(
        `CREATE TABLE IF NOT EXISTS user_sessions (
           session_hash CHAR(64) PRIMARY KEY,
           user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
           expires_at TIMESTAMPTZ NOT NULL,
           created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
         )`,
      ).then(async () => {
        await this.dataSource.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_expiry ON user_sessions(expires_at)');
        await this.dataSource.query('GRANT SELECT, INSERT, DELETE ON user_sessions TO transport');
      }).then(() => undefined).catch((error) => {
        this.schemaReady = undefined;
        throw error;
      });
    }
    await this.schemaReady;
  }

  private hash(sessionId: string) {
    return createHash('sha256').update(sessionId).digest('hex');
  }

  async create(userId: number) {
    await this.ensureTable();
    await this.dataSource.query('DELETE FROM user_sessions WHERE expires_at <= NOW()');
    const sessionId = randomBytes(32).toString('base64url');
    await this.dataSource.query(
      'INSERT INTO user_sessions (session_hash, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
      [this.hash(sessionId), userId],
    );
    return sessionId;
  }

  getSessionId(request: any): string | undefined {
    const cookieHeader = request.headers?.cookie as string | undefined;
    const cookie = cookieHeader?.split(';').map((part) => part.trim()).find((part) => part.startsWith('transport_session='));
    if (!cookie) return undefined;
    try { return decodeURIComponent(cookie.slice('transport_session='.length)); }
    catch { return undefined; }
  }

  async findUser(sessionId: string): Promise<SessionUser | null> {
    await this.ensureTable();
    const [user] = await this.dataSource.query(
      `SELECT u.id, u.role_id AS "roleId", r.name AS role
       FROM user_sessions s
       JOIN users u ON u.id = s.user_id
       JOIN roles r ON r.id = u.role_id
       WHERE s.session_hash = $1 AND s.expires_at > NOW() AND u.is_active = TRUE`,
      [this.hash(sessionId)],
    );
    return user ? { id: Number(user.id), roleId: Number(user.roleId), role: user.role } : null;
  }

  async requireUser(request: any): Promise<SessionUser> {
    const sessionId = this.getSessionId(request);
    if (!sessionId) throw new UnauthorizedException('Потрібно увійти в систему');
    const user = await this.findUser(sessionId);
    if (!user) throw new UnauthorizedException('Сесію завершено. Увійдіть знову.');
    request.user = user;
    return user;
  }

  async destroy(sessionId?: string) {
    if (!sessionId) return;
    await this.ensureTable();
    await this.dataSource.query('DELETE FROM user_sessions WHERE session_hash = $1', [this.hash(sessionId)]);
  }
}
