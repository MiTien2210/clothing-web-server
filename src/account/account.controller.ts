import { Body, Controller, Post } from '@nestjs/common';
import { AccountService } from './account.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { LoginDto } from './dto/login.dto';

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
}
