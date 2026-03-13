import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const auth = request.headers.authorization;

    if (!auth) throw new UnauthorizedException('No token provided');

    const token = auth.replace('Bearer ', '');
    const user = this.authService.verifyToken(token);

    request.user = user;
    request.token = token;
    return true;
  }
}
