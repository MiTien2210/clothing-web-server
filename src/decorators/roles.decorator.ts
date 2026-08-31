import { SetMetadata } from '@nestjs/common';

// Chỉ "dán nhãn" role yêu cầu lên route, chưa tự kiểm tra gì
// -> RolesGuard sẽ đọc lại nhãn này để so sánh với role thật của user
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
