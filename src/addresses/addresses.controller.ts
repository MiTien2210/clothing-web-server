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
import { AuthGuard } from 'src/common/guards/auth.guard';
import { AddressesService } from './addresses.service';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

type JwtUser = { sub: string; email: string; role: string };

@Controller('addresses')
@UseGuards(AuthGuard)
export class AddressesController {
  constructor(private readonly addressService: AddressesService) {}

  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    return this.addressService.findAll(user.sub);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.addressService.findOne(user.sub, id);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateAddressDto) {
    return this.addressService.createAddress(user.sub, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressService.updateAddress(user.sub, id, dto);
  }

  @Delete(':id')
  delete(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.addressService.removeAddress(user.sub, id);
  }
}
