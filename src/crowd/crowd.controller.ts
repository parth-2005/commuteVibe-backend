import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { CrowdService } from './crowd.service.js'
import { CreateCrowdReportDto } from './dto/create-crowd-report.dto.js'
import { JwtGuard } from '../auth/guards/jwt.guard.js'
import { CurrentUser } from '../common/decorators/current-user.decorator.js'
import { CrowdGateway } from './crowd.gateway.js'

@Controller('crowd')
@UseGuards(JwtGuard)
export class CrowdController {
  constructor(private crowdService: CrowdService, private gateway: CrowdGateway) {}

  @Post()
  async create(@CurrentUser() user: any, @Body() dto: CreateCrowdReportDto) {
    const report = await this.crowdService.createReport(user.id, dto)
    this.gateway.broadcastNewReport(report)
    return { data: report, message: 'Report created' }
  }

  @Get('nearby')
  async nearby(@Query('lat') lat: string, @Query('lng') lng: string) {
    const reports = await this.crowdService.getNearbyReports(Number(lat), Number(lng))
    return { data: reports, message: 'Success' }
  }

  @Get('area-level')
  async areaLevel(@Query('lat') lat: string, @Query('lng') lng: string) {
    const level = await this.crowdService.getAreaLevel(Number(lat), Number(lng))
    return { data: level, message: 'Success' }
  }
}
