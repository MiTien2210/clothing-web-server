import { InjectRepository } from '@nestjs/typeorm';
import { CartItem } from './cart-item.entity';
import { Repository } from 'typeorm';
import { ProductVariant } from 'src/product-variants/product-variant.entity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { User } from 'src/users/user.entity';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
  ) {}

  private async findOwnedItem(userId: string, id: string) {
    const item = await this.cartItemRepository.findOne({
      where: { id, user: { id: userId } },
      relations: { productVariant: true },
    });
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }
    return item;
  }

  async getCart(userId: string) {
    return this.cartItemRepository.find({
      where: { user: { id: userId } },
      relations: { productVariant: { product: { category: true } } },
    });
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const productVariant = await this.productVariantRepository.findOne({
      where: { id: dto.productVariantId },
    });
    if (!productVariant) {
      throw new NotFoundException('Product variant not found');
    }

    const existingItem = await this.cartItemRepository.findOne({
      where: {
        user: { id: userId },
        productVariant: { id: dto.productVariantId },
      },
    });

    const newQuantity = (existingItem?.quantity ?? 0) + dto.quantity;
    if (newQuantity > productVariant.stock_quantity) {
      throw new BadRequestException('Not enough stock for this variant');
    }

    if (existingItem) {
      existingItem.quantity = newQuantity;
      return this.cartItemRepository.save(existingItem);
    }

    const cartItem = this.cartItemRepository.create({
      user: { id: userId } as User,
      productVariant: { id: dto.productVariantId } as ProductVariant,
      quantity: dto.quantity,
    });
    return this.cartItemRepository.save(cartItem);
  }

  async updateItem(userId: string, id: string, dto: UpdateCartItemDto) {
    const item = await this.findOwnedItem(userId, id);
    if (dto.quantity > item.productVariant.stock_quantity) {
      throw new BadRequestException('Not enough stock for this variant');
    }
    item.quantity = dto.quantity;
    return this.cartItemRepository.save(item);
  }

  async removeItem(userId: string, id: string) {
    const item = await this.findOwnedItem(userId, id);
    await this.cartItemRepository.remove(item);
    return { message: 'Cart item removed' };
  }
}
