import { Injectable, NotFoundException } from '@nestjs/common';
import { Product } from './product.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { Category } from 'src/categories/category.entity';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async createProduct(createProductDto: CreateProductDto) {
    const product = this.productRepository.create({
      name: createProductDto.name,
      description: createProductDto.description,
      material: createProductDto.material,
      care_instructions: createProductDto.care_instructions,
      category: { id: createProductDto.categoryId } as Category,
    });
    return this.productRepository.save(product);
  }

  async findAllProduct() {
    return await this.productRepository.find({ relations: { category: true } });
  }

  async findOneProduct(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async UpdateProduct(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.findOneProduct(id);

    if (updateProductDto.name !== undefined) {
      product.name = updateProductDto.name;
    }
    if (updateProductDto.description !== undefined) {
      product.description = updateProductDto.description;
    }

    if (updateProductDto.material !== undefined) {
      product.material = updateProductDto.material;
    }

    if (updateProductDto.care_instructions !== undefined) {
      product.care_instructions = updateProductDto.care_instructions;
    }

    if (updateProductDto.categoryId !== undefined) {
      product.category = { id: updateProductDto.categoryId } as Category;
    }

    return this.productRepository.save(product);
  }

  async deleteProduct(id: string) {
    const result = await this.productRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Product not found');
    }
    return { message: 'Product deleted successfully' };
  }
}
