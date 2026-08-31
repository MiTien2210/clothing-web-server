import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from 'src/decorators/roles.decorator';

// RolesGuard: kiểm tra phân quyền (authorization) — chạy SAU AuthGuard,
// vì cần request.user.role đã được AuthGuard giải mã từ JWT và gắn sẵn
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // đọc nhãn '@Roles(...)' đã dán trên route (method trước, class sau)
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // route không gắn @Roles() -> không giới hạn role, cho qua luôn
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    // so sánh role thật của user (do AuthGuard gắn) với role route yêu cầu
    // return false -> NestJS TỰ ĐỘNG trả 403 Forbidden, không cần tự throw
    return requiredRoles.includes(request.user?.role ?? '');
  }
}
