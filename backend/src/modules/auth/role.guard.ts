import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService, private readonly usersService: UsersService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const routePath = request.route?.path as string | undefined;
    const expectedRole = routePath?.includes('driver') || routePath?.endsWith('/report') ? 'driver' : 'mechanic';
    const authorization = request.headers.authorization as string | undefined;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
    if (!token) throw new UnauthorizedException('Потрібно увійти в систему');
    let payload: { sub?: number; roleId?: number };
    try { payload = await this.jwtService.verifyAsync(token); }
    catch { throw new UnauthorizedException('Сесія завершилася. Увійдіть знову.'); }
    const role = await this.usersService.getRoleName(Number(payload.roleId));
    if (role !== expectedRole) throw new ForbiddenException('Недостатньо прав для цієї дії');
    request.user = { id: Number(payload.sub), roleId: Number(payload.roleId) };
    return true;
  }
}
