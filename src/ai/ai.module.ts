import { Module } from '@nestjs/common'
import { AiService } from './ai.service'
import { RoutesModule } from '../routes/routes.module'
import { CrowdModule } from '../crowd/crowd.module'

@Module({
  imports: [RoutesModule, CrowdModule],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
