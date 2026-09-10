import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CartItem } from './cart-item.entity';
import { ProductVariant } from 'src/product-variants/product-variant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CartItem, ProductVariant])],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
