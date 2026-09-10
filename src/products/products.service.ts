import { Injectable, NotFoundException } from '@nestjs/common';
import { Product } from './product.entity';
import { In, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { Category } from 'src/categories/category.entity';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';

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

  private buildFilteredQuery(query: GetProductsQueryDto) {
    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.category', 'category')
      .leftJoin('product.variants', 'variant');

    if (query.categoryId) {
      qb.andWhere(
        '(category.id = :categoryId OR category.parent = :categoryId)',
        { categoryId: query.categoryId },
      );
    }

    if (query.search) {
      qb.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.size) {
      qb.andWhere('variant.size = :size', { size: query.size });
    }

    if (query.color) {
      qb.andWhere('variant.color = :color', { color: query.color });
    }

    if (query.material) {
      qb.andWhere('product.material ILIKE :material', {
        material: `%${query.material}%`,
      });
    }

    if (query.minPrice !== undefined) {
      qb.andWhere('variant.price >= :minPrice', { minPrice: query.minPrice });
    }

    if (query.maxPrice !== undefined) {
      qb.andWhere('variant.price <= :maxPrice', { maxPrice: query.maxPrice });
    }

    return qb;
  }

  async findAllProduct(query: GetProductsQueryDto = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const countResult = await this.buildFilteredQuery(query)
      .select('COUNT(DISTINCT product.id)', 'count')
      .getRawOne<{ count: string }>();

    const total = Number(countResult?.count ?? 0);

    const sortColumn =
      query.sortBy === 'price_asc' || query.sortBy === 'price_desc'
        ? 'MIN(variant.price)'
        : 'product.created_at';
    const sortDirection = query.sortBy === 'price_asc' ? 'ASC' : 'DESC';

    const idRows = await this.buildFilteredQuery(query)
      .select('product.id', 'id')
      .groupBy('product.id')
      .orderBy(sortColumn, sortDirection)
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany<{ id: string }>();

    const ids = idRows.map((row) => row.id);
    if (ids.length === 0) {
      return { data: [], total, page, limit };
    }

    const products = await this.productRepository.find({
      where: { id: In(ids) },
      relations: { category: true, variants: true },
    });

    const orderMap = new Map(ids.map((id, index) => [id, index]));
    products.sort((a, b) => orderMap.get(a.id)! - orderMap.get(b.id)!);

    return { data: products, total, page, limit };
  }

  async findOneProduct(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: { category: true, variants: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async findRelatedProducts(id: string, limit = 4) {
    const product = await this.findOneProduct(id);
    return this.productRepository.find({
      where: {
        category: { id: product.category.id },
        id: Not(id),
      },
      relations: { category: true, variants: true },
      take: limit,
    });
  }

  async findAvailableFilters() {
    const sizeRows = await this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.variants', 'variant')
      .select('DISTINCT variant.size', 'size')
      .where('variant.size IS NOT NULL')
      .getRawMany<{ size: string }>();

    const colorRows = await this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.variants', 'variant')
      .select('DISTINCT variant.color', 'color')
      .where('variant.color IS NOT NULL')
      .getRawMany<{ color: string }>();

    const materialRows = await this.productRepository
      .createQueryBuilder('product')
      .select('DISTINCT product.material', 'material')
      .where('product.material IS NOT NULL')
      .getRawMany<{ material: string }>();

    return {
      sizes: sizeRows.map((row) => row.size),
      colors: colorRows.map((row) => row.color),
      materials: materialRows.map((row) => row.material),
    };
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
