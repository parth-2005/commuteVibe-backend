import { Module } from '@nestjs/common'
import { CrowdService } from './crowd.service'
import { CrowdController } from './crowd.controller'
import { CrowdGateway } from './crowd.gateway'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  providers: [CrowdService, CrowdGateway],
  controllers: [CrowdController],
  exports: [CrowdService],
})
export class CrowdModule {}
