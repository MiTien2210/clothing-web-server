import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { Repository } from 'typeorm';
import { RegisterDto } from './dto/register.dto';
import { hashPasswordHelper } from 'src/helpers/util';
import { REDIS_CLIENT } from 'src/redis/redis.constants';
import Redis from 'ioredis';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import {
  MAX_WRONG_OTP_ATTEMPTS,
  OTP_EXPIRATION_SECONDS,
  RESEND_OTP_COOLDOWN_SECONDS,
} from './account.constants';
import { ResendOtpDto } from './dto/resend-otp.dto';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async register(registerDto: RegisterDto) {
    // check xem email này có user nào đăng kí chưa
    const existingUser = await this.usersRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException(
        `Email ${registerDto.email} already exists. Please use another email address.`,
      );
    }

    // hash password
    const passwordHash = await hashPasswordHelper(registerDto.password);

    // tạo user
    const user = this.usersRepository.create({
      full_name: registerDto.full_name,
      email: registerDto.email,
      phone: registerDto.phone,
      password_hash: passwordHash,
    });

    // lưu user vào db
    const savedUser = await this.usersRepository.save(user);

    // tạo mã otp
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redis.set(`otp:${savedUser.email}`, otp, 'EX', 300); // TTL 5 phút

    console.log(`[DEV] OTP cho ${savedUser.email}: ${otp}`);

    return savedUser.id;
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    // otp:${email} => 	"864517" (mã OTP thật) => Lưu mã OTP để so sánh lúc verify
    // otp:attempts:${email} => "3" (số lần đã sai)	=> Đếm số lần nhập sai
    const key = `otp:${verifyOtpDto.email}`;
    const attemptsKey = `otp:attempts:${verifyOtpDto.email}`;

    // lấy mã OTP đang lưu ở Redis (có thể từ lúc đăng ký hoặc lúc resend)
    const storedOtp = await this.redis.get(key);

    if (!storedOtp) {
      throw new BadRequestException('The OTP has expired or does not exist.');
    }

    // check xem số lần nhập otp sai là bao nhiêu rồi
    // >= MAX_WRONG_OTP_ATTEMPTS => trả về luôn
    const currentAttempts = Number((await this.redis.get(attemptsKey)) ?? 0);

    if (currentAttempts >= MAX_WRONG_OTP_ATTEMPTS) {
      await this.redis.del(key);
      await this.redis.del(attemptsKey);
      throw new BadRequestException(
        'You have entered the wrong code too many times. Please request a new OTP.',
      );
    }

    // check xem otp lưu ở redis có khớp với otp user nhập không?
    if (storedOtp !== verifyOtpDto.otp) {
      const attempts = await this.redis.incr(attemptsKey);
      if (attempts === 1) {
        await this.redis.expire(attemptsKey, OTP_EXPIRATION_SECONDS);
      }
      throw new BadRequestException(
        `The OTP is incorrect. You have ${MAX_WRONG_OTP_ATTEMPTS - attempts} attempt(s) left.`,
      );
    }

    // otp khớp => update db + xoá các key ở redis
    const user = await this.usersRepository.findOne({
      where: { email: verifyOtpDto.email },
    });

    if (!user) {
      throw new NotFoundException('Account not found');
    }

    await this.usersRepository.update(user.id, { is_verified: true });
    await this.redis.del(key);
    await this.redis.del(attemptsKey);

    return { message: 'Verification successful' };
  }

  async resendOtp(resendOtpDto: ResendOtpDto) {
    // Check xem user có tồn tại chưa
    const user = await this.usersRepository.findOne({
      where: { email: resendOtpDto.email },
    });
    if (!user) {
      throw new NotFoundException('Account not found');
    }

    if (user.is_verified) {
      throw new BadRequestException('Account already verified');
    }

    // otp:resend-block:${email} =>	"1" (chỉ là cờ đánh dấu, không có ý nghĩa số học)
    // Đánh dấu "vừa gửi cách đây chưa tới 60s, chưa được gửi lại"
    const resendBlockKey = `otp:resend-block:${resendOtpDto.email}`;
    const isResendBlocked = await this.redis.exists(resendBlockKey);

    // Nếu vẫn đang trong 60s cooldown thì chặn, báo còn bao nhiêu giây
    if (isResendBlocked) {
      const ttl = await this.redis.ttl(resendBlockKey);
      throw new BadRequestException(
        `Please wait ${ttl} second(s) before requesting a new OTP.`,
      );
    }

    // tạo lại otp mới
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Tạo OTP mới, ghi đè lên mã cũ (nếu còn) và reset lại TTL 5 phút
    await this.redis.set(
      `otp:${resendOtpDto.email}`,
      otp,
      'EX',
      OTP_EXPIRATION_SECONDS,
    );

    // Reset số lần nhập sai về 0 — vì đây là mã hoàn toàn mới,
    // không nên giữ lại số lần sai của mã cũ để tính vào mã mới
    await this.redis.del(`otp:attempts:${resendOtpDto.email}`);

    // Đánh dấu bắt đầu cooldown 60s, chặn không cho gửi lại liên tục
    await this.redis.set(
      resendBlockKey,
      '1',
      'EX',
      RESEND_OTP_COOLDOWN_SECONDS,
    );

    console.log(`[DEV] OTP mới cho ${resendOtpDto.email}: ${otp}`);

    return { message: 'A new OTP has been sent' };
  }
}
