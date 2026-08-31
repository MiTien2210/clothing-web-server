import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { IsNull, Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async createCategory(createCategoryDto: CreateCategoryDto) {
    const category = this.categoryRepository.create({
      name: createCategoryDto.name,
      parent: createCategoryDto.parentId
        ? ({ id: createCategoryDto.parentId } as Category)
        : null,
    });
    return this.categoryRepository.save(category);
  }

  async findAllCategories() {
    return this.categoryRepository.find({
      where: { parent: IsNull() },
      relations: { children: true },
    });
  }

  async findOneCategory(id: string) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: { children: true, parent: true },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOneCategory(id);
    if (updateCategoryDto.name !== undefined) {
      category.name = updateCategoryDto.name;
    }

    if (updateCategoryDto.parentId !== undefined) {
      category.parent = { id: updateCategoryDto.parentId } as Category;
    }

    return this.categoryRepository.save(category);
  }

  async deleteCategory(id: string) {
    const category = await this.findOneCategory(id);
    await this.categoryRepository.remove(category);

    // const result = await this.categoryRepository.delete(id);
    // if (result.affected === 0) {
    //   throw new NotFoundException('Category not found');
    // }

    // remove -> truyền vào 1 entity
    // delete -> truyền vào 1 id
    return { message: 'Category deleted successfully' };
  }
}
