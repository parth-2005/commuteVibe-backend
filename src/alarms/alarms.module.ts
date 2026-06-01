import { Module } from '@nestjs/common'
import { AlarmsService } from './alarms.service'
import { AlarmsController } from './alarms.controller'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  providers: [AlarmsService],
  controllers: [AlarmsController],
})
export class AlarmsModule {}
