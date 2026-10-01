import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  addressId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  cartItemIds: string[];
}
