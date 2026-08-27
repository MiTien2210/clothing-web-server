import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

// Guard: xác thực (authentication) — kiểm tra request có access token hợp lệ không
// Chưa xử lý phân quyền (authorization) theo role — role chỉ được lấy ra và gắn sẵn vào request để dùng sau
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    try {
      // verify chữ ký + giải mã token (không phải băm) để lấy lại payload đã ký lúc login
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        role: string;
      }>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });

      request.user = payload; // gắn user vào request để controller/decorator dùng sau
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    return true; // token hợp lệ -> cho request đi tiếp
  }

  // tách token khỏi header "Authorization: Bearer <token>"
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
