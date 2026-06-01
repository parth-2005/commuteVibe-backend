import { Module } from '@nestjs/common'
import { CrowdService } from './crowd.service.js'
import { CrowdController } from './crowd.controller.js'
import { CrowdGateway } from './crowd.gateway.js'
import { PrismaModule } from '../prisma/prisma.module.js'

@Module({
  imports: [PrismaModule],
  providers: [CrowdService, CrowdGateway],
  controllers: [CrowdController],
  exports: [CrowdService],
})
export class CrowdModule {}
