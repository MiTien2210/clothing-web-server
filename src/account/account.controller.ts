import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AccountService } from './account.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.accountService.register(dto);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.accountService.verifyOtp(dto);
  }

  @Post('resend-otp')
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.accountService.resendOtp(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.accountService.login(dto);
  }

  @Post('refresh')
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.accountService.refreshToken(dto);
  }

  @Post('logout')
  async logout(@Body() dto: RefreshTokenDto) {
    return this.accountService.logout(dto);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getProfile(
    @CurrentUser() user: { sub: string; email: string; role: string },
  ) {
    return user;
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.accountService.forgotPassword(dto);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.accountService.resetPassword(dto);
  }
}
