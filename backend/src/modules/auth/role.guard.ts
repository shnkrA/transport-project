import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { SessionService } from './session.service';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const routePath = request.route?.path as string | undefined;
    const expectedRole = routePath?.includes('driver') || routePath?.endsWith('/report') ? 'driver' : 'mechanic';
    const user = await this.sessions.requireUser(request);
    if (user.role !== expectedRole) throw new ForbiddenException('Недостатньо прав для цієї дії');
    return true;
  }
}
