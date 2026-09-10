import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { CartService } from './cart.service';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

type JwtUser = { sub: string; email: string; role: string };
@Controller('cart')
@UseGuards(AuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: JwtUser) {
    return this.cartService.getCart(user.sub);
  }

  @Post()
  addItem(@CurrentUser() user: JwtUser, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(user.sub, dto);
  }

  @Patch(':id')
  updateItem(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(user.sub, id, dto);
  }

  @Delete(':id')
  removeItem(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.cartService.removeItem(user.sub, id);
  }
}
