import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

export interface RequestWithCookies extends Request {
  cookies: Record<string, string>; // or more specific if you want
}

@Injectable()
export class JwtCookieAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req: RequestWithCookies = context.switchToHttp().getRequest();
    const token = req.cookies?.auth_token;

    if (!token) return false;

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = this.jwtService.verify(token);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      req['user'] = payload;
      return true;
    } catch {
      return false;
    }
  }
}
