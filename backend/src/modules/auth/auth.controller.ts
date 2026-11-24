import { Controller, Post, Body, HttpCode, HttpStatus, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { LoginDto, RegisterDto } from './auth.dto';

const COOKIE_NAME = 'transport_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessions: SessionService,
  ) {}

  private setSessionCookie(response: any, sessionId: string) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    response.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(sessionId)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE}${secure}`);
  }

  @Post('register')
  async register(@Body() data: RegisterDto, @Res({ passthrough: true }) response: any) {
    const session = await this.authService.register(data);
    this.setSessionCookie(response, session.sessionId);
    return { user: session.user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() credentials: LoginDto, @Res({ passthrough: true }) response: any) {
    const session = await this.authService.login(credentials);
    this.setSessionCookie(response, session.sessionId);
    return { user: session.user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() request: any, @Res({ passthrough: true }) response: any) {
    await this.authService.logout(this.sessions.getSessionId(request));
    response.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
  }
}
