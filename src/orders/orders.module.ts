import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Address } from 'src/addresses/address.entity';
import { CartItem } from 'src/cart/cart-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Address, CartItem])],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
