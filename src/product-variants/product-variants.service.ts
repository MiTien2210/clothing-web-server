import { InjectRepository } from '@nestjs/typeorm';
import { ProductVariant } from './product-variant.entity';
import { Repository } from 'typeorm';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { Product } from 'src/products/product.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';

@Injectable()
export class ProductVariantsService {
  constructor(
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
  ) {}

  async findAllProductVariant() {
    return await this.productVariantRepository.find({
      relations: { product: true },
    });
  }

  async findProductVariantById(id: string) {
    const productVariant = await this.productVariantRepository.findOne({
      where: { id },
      relations: { product: true },
    });
    if (!productVariant) {
      throw new NotFoundException('Product variant not found');
    }
    return productVariant;
  }

  async createProductVariant(createProductVariantDto: CreateProductVariantDto) {
    const productVariant = this.productVariantRepository.create({
      size: createProductVariantDto.size,

      color: createProductVariantDto.color,

      price: createProductVariantDto.price,

      stock_quantity: createProductVariantDto.stock_quantity,

      sku: createProductVariantDto.sku,

      product: { id: createProductVariantDto.productId } as Product,
    });
    return this.productVariantRepository.save(productVariant);
  }

  async updateProductVariant(
    id: string,
    updateProductVariantDto: UpdateProductVariantDto,
  ) {
    const productVariant = await this.findProductVariantById(id);

    if (updateProductVariantDto.size !== undefined) {
      productVariant.size = updateProductVariantDto.size;
    }

    if (updateProductVariantDto.color !== undefined) {
      productVariant.color = updateProductVariantDto.color;
    }

    if (updateProductVariantDto.price !== undefined) {
      productVariant.price = updateProductVariantDto.price;
    }

    if (updateProductVariantDto.stock_quantity !== undefined) {
      productVariant.stock_quantity = updateProductVariantDto.stock_quantity;
    }

    if (updateProductVariantDto.sku !== undefined) {
      productVariant.sku = updateProductVariantDto.sku;
    }

    if (updateProductVariantDto.productId !== undefined) {
      productVariant.product = {
        id: updateProductVariantDto.productId,
      } as Product;
    }

    return this.productVariantRepository.save(productVariant);
  }

  async deleteProductVariant(id: string) {
    const productVariant = await this.findProductVariantById(id);
    await this.productVariantRepository.remove(productVariant);
    return { message: 'Product variant deleted successfully' };
  }
}
