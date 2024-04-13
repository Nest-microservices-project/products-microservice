import { Module } from '@nestjs/common';
import { ProductsService } from './productos.service';
import { ProductosController } from './productos.controller';

@Module({
  controllers: [ProductosController],
  providers: [ProductsService],
})
export class ProductosModule {}
