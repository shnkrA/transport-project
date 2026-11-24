import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SessionService } from './session.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessions: SessionService,
  ) {}

  async register(data: { firstName: string; lastName: string; email: string; password: string }) {
    const email = data.email.toLowerCase().trim();
    if (await this.usersService.findByEmail(email)) {
      throw new ConflictException('Ця електронна пошта вже зареєстрована');
    }
    const role = await this.usersService.findRoleByName('user');
    if (!role) throw new UnauthorizedException('Роль користувача не налаштована');
    const user = await this.usersService.create({ ...data, email, roleId: role.id });
    return this.createSession(user);
  }

  async login(credentials: { email: string; password: string }) {
    const user = await this.usersService.findByEmail(credentials.email);
    if (!user) throw new UnauthorizedException('Невірний email або пароль');
    const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!isPasswordValid) throw new UnauthorizedException('Невірний email або пароль');
    if (!user.isActive) throw new UnauthorizedException('Обліковий запис вимкнено');
    return this.createSession(user);
  }

  private async createSession(user: { id: number; email: string; firstName: string; lastName: string; roleId: number }) {
    return {
      sessionId: await this.sessions.create(user.id),
      user: {
        id: user.id, email: user.email, firstName: user.firstName,
        lastName: user.lastName, roleId: user.roleId,
        role: await this.usersService.getRoleName(user.roleId),
      },
    };
  }

  async logout(sessionId?: string) {
    await this.sessions.destroy(sessionId);
  }
}
