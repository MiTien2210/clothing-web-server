import { InjectRepository } from '@nestjs/typeorm';
import { Address } from './address.entity';
import { Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { User } from 'src/users/user.entity';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  private async unsetCurrentDefault(userId: string) {
    await this.addressRepository.update(
      { user: { id: userId }, is_default: true },
      { is_default: false },
    );
  }
  async findAll(userId: string) {
    return this.addressRepository.find({ where: { user: { id: userId } } });
  }

  async findOne(userId: string, id: string) {
    const address = await this.addressRepository.findOne({
      where: { id, user: { id: userId } },
    });
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    return address;
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    if (dto.is_default) {
      await this.unsetCurrentDefault(userId);
    }
    const address = this.addressRepository.create({
      recipient_name: dto.recipient_name,
      phone: dto.phone,
      address_line: dto.address_line,
      ward: dto.ward,
      district: dto.district,
      province: dto.province,
      is_default: dto.is_default ?? false,
      user: { id: userId } as User,
    });
    return this.addressRepository.save(address);
  }

  async updateAddress(userId: string, id: string, dto: UpdateAddressDto) {
    const address = await this.findOne(userId, id);

    if (dto.is_default) {
      await this.unsetCurrentDefault(userId);
    }

    if (dto.recipient_name !== undefined) {
      address.recipient_name = dto.recipient_name;
    }
    if (dto.phone !== undefined) {
      address.phone = dto.phone;
    }
    if (dto.address_line !== undefined) {
      address.address_line = dto.address_line;
    }
    if (dto.ward !== undefined) {
      address.ward = dto.ward;
    }
    if (dto.district !== undefined) {
      address.district = dto.district;
    }
    if (dto.province !== undefined) {
      address.province = dto.province;
    }
    if (dto.is_default !== undefined) {
      address.is_default = dto.is_default;
    }

    return this.addressRepository.save(address);
  }

  async removeAddress(userId: string, id: string) {
    const address = await this.findOne(userId, id);
    await this.addressRepository.remove(address);
    return { message: 'Address deleted successfully' };
  }
}
