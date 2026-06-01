import { Module } from '@nestjs/common'
import { AiService } from './ai.service.js'
import { AiController } from './ai.controller.js'
import { RoutesModule } from '../routes/routes.module.js'
import { CrowdModule } from '../crowd/crowd.module.js'

@Module({
  imports: [RoutesModule, CrowdModule],
  providers: [AiService],
  controllers: [AiController],
  exports: [AiService],
})
export class AiModule {}
