/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-producto.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import { PaginationDTO } from 'src/common';
import { isObjectEmpty } from 'src/utils';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('ProductsService');
  onModuleInit() {
    this.$connect();
    this.logger.log('Database connected...');
  }

  create(createProductoDto: CreateProductDto) {
    return this.product.create({
      data: createProductoDto,
    });
  }

  async findAll(paginationDTO: PaginationDTO) {
    const { page, limit } = paginationDTO;
    const totalPages = await this.product.count({ where: { available: true } });
    const lastPage = Math.ceil(totalPages / limit);

    return {
      data: await this.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: { available: true },
      }),
      meta: {
        total: totalPages,
        page: page,
        lastPage: lastPage,
      },
    };
  }

  async findOne(id: number) {
    const product = await this.product.findFirst({
      where: { id: id, available: true },
    });
    if (!product) {
      this.logger.error(`Product with this Id ${id} not found.`);
      throw new RpcException({
        message: `Product with this Id ${id} not found.`,
        status: HttpStatus.BAD_REQUEST,
      });
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const { id: __, ...data } = updateProductDto;
    if (isObjectEmpty(updateProductDto)) {
      this.logger.error(`You should send some data in body.`);
      throw new RpcException({
        message: `You should send some data in body.`,
        status: HttpStatus.BAD_REQUEST,
      });
    }

    try {
      await this.findOne(id);
    } catch (e) {
      this.logger.error(`Product with this Id ${id} not found.`);

      throw new RpcException({
        message: `You should send some data in body.`,
        status: HttpStatus.NOT_FOUND,
      });
    }

    return this.product.update({
      where: { id },
      data: data,
    });
  }

  async remove(id: number) {
    // Soft delete:
    try {
      await this.findOne(id);
    } catch (e) {
      this.logger.error(`Product with this Id ${id} not found.`);
      throw new NotFoundException(`Product with this Id ${id} not found.`);
    }

    const product = this.product.update({
      where: { id },
      data: {
        available: false,
      },
    });
    return product;
  }

  async validateProducts(ids: number[]) {
    ids = Array.from(new Set(ids));

    const products = await this.product.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    if (products.length !== ids.length) {
      throw new RpcException({
        message: 'Some products were not found',
        status: HttpStatus.BAD_REQUEST,
      });
    }

    return products;
  }
}
