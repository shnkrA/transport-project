import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class DispatcherGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService, private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization as string | undefined;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
    if (!token) throw new UnauthorizedException('Потрібно увійти в систему');
    let payload: { sub?: number; roleId?: number };
    try { payload = await this.jwtService.verifyAsync(token); }
    catch { throw new UnauthorizedException('Сесія завершилася. Увійдіть знову.'); }
    if (await this.usersService.getRoleName(Number(payload.roleId)) !== 'dispatcher') {
      throw new ForbiddenException('Ця дія доступна диспетчеру');
    }
    request.user = { id: Number(payload.sub), roleId: Number(payload.roleId) };
    return true;
  }
}
