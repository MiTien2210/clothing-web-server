import { IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';

export class CreateProductVariantDto {
  @IsString()
  @IsNotEmpty()
  size: string;

  @IsString()
  @IsNotEmpty()
  color: string;

  @IsInt()
  @Min(0)
  price: number;

  @IsInt()
  @Min(0)
  stock_quantity: number;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsUUID()
  productId: string;
}
