import { Module } from '@nestjs/common'
import { AlarmsService } from './alarms.service.js'
import { AlarmsController } from './alarms.controller.js'
import { PrismaModule } from '../prisma/prisma.module.js'

@Module({
  imports: [PrismaModule],
  providers: [AlarmsService],
  controllers: [AlarmsController],
})
export class AlarmsModule {}
