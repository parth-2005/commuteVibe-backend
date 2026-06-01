import { Module } from '@nestjs/common'
import { RoutesService } from './routes.service.js'
import { RoutesController } from './routes.controller.js'
import { PrismaModule } from '../prisma/prisma.module.js'

@Module({
  imports: [PrismaModule],
  providers: [RoutesService],
  controllers: [RoutesController],
  exports: [RoutesService],
})
export class RoutesModule {}
