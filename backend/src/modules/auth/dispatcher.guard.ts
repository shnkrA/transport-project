import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { SessionService } from './session.service';

@Injectable()
export class DispatcherGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = await this.sessions.requireUser(request);
    if (user.role !== 'dispatcher') throw new ForbiddenException('Ця дія доступна диспетчеру');
    return true;
  }
}
