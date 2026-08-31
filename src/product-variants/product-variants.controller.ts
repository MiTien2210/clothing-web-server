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
import { ProductVariantsService } from './product-variants.service';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';

@Controller('product-variants')
export class ProductVariantsController {
  constructor(
    private readonly productVariantsService: ProductVariantsService,
  ) {}

  @Get()
  findAll() {
    return this.productVariantsService.findAllProductVariant();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productVariantsService.findProductVariantById(id);
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() dto: CreateProductVariantDto) {
    return this.productVariantsService.createProductVariant(dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: UpdateProductVariantDto) {
    return this.productVariantsService.updateProductVariant(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  delete(@Param('id') id: string) {
    return this.productVariantsService.deleteProductVariant(id);
  }
}
