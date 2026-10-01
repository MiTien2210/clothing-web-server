import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { OrdersService } from './orders.service';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { CreateOrderDto } from './dto/create-order.dto';

type JwtUser = { sub: string; email: string; role: string };

@Controller('orders')
@UseGuards(AuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  createOrder(@CurrentUser() user: JwtUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(user.sub, dto);
  }

  @Get()
  findAllOrders(@CurrentUser() user: JwtUser) {
    return this.ordersService.findAllOrdersForUser(user.sub);
  }

  @Get(':id')
  findOneOrder(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.ordersService.findOneOrderForUser(user.sub, id);
  }
}
