import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Address } from 'src/addresses/address.entity';
import { CartItem } from 'src/cart/cart-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from 'src/users/user.entity';
import { OrderItem } from './order-item.entity';

const FREE_SHIPPING_THRESHOLD = 1200000;
const FLAT_SHIPPING_FEE = 30000;

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  private calculateShippingFee(subtotal: number) {
    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
    const address = await this.addressRepository.findOne({
      where: { id: dto.addressId, user: { id: userId } },
    });
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    const cartItems = await this.cartItemRepository.find({
      where: { id: In(dto.cartItemIds), user: { id: userId } },
      relations: { productVariant: { product: true } },
    });

    if (cartItems.length !== dto.cartItemIds.length) {
      throw new NotFoundException('Some cart items were not found');
    }

    for (const item of cartItems) {
      if (item.quantity > item.productVariant.stock_quantity) {
        throw new BadRequestException(
          `Not enough stock for ${item.productVariant.product.name}`,
        );
      }
    }

    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.productVariant.price * item.quantity,
      0,
    );

    const shippingFee = this.calculateShippingFee(subtotal);

    const total = subtotal + shippingFee;

    return this.dataSource.transaction(async (manager) => {
      const order = manager.create(Order, {
        user: { id: userId } as User,
        recipient_name: address.recipient_name,
        phone: address.phone,
        address_line: address.address_line,
        ward: address.ward,
        district: address.district,
        province: address.province,
        shipping_fee: shippingFee,
        subtotal,
        total,
        status: OrderStatus.PENDING,
      });
      await manager.save(order);

      for (const item of cartItems) {
        const orderItem = manager.create(OrderItem, {
          order,
          productVariant: item.productVariant,
          product_name: item.productVariant.product.name,
          size: item.productVariant.size,
          color: item.productVariant.color,
          price: item.productVariant.price,
          quantity: item.quantity,
        });
        await manager.save(orderItem);

        item.productVariant.stock_quantity -= item.quantity;
        await manager.save(item.productVariant);
      }

      await manager.remove(cartItems);
      return order;
    });
  }

  async findAllOrdersForUser(userId: string) {
    return this.orderRepository.find({
      where: { user: { id: userId } },
      relations: { items: true },
      order: { created_at: 'DESC' },
    });
  }

  async findOneOrderForUser(userId: string, id: string) {
    const order = await this.orderRepository.findOne({
      where: { id, user: { id: userId } },
      relations: { items: { productVariant: true } },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }
}
