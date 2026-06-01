import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { RoutesService } from './routes.service'
import { CreateRouteDto } from './dto/create-route.dto'
import { JwtGuard } from '../auth/guards/jwt.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@Controller('routes')
@UseGuards(JwtGuard)
export class RoutesController {
  constructor(private routesService: RoutesService) {}

  @Post()
  async create(@CurrentUser() user: any, @Body() dto: CreateRouteDto) {
    const route = await this.routesService.createRoute(user.id, dto)
    return { data: route, message: 'Route saved' }
  }

  @Get()
  async list(@CurrentUser() user: any, @Query('limit') limit?: string) {
    const routes = await this.routesService.getUserRoutes(user.id, limit ? Number(limit) : 20)
    return { data: routes, message: 'Success' }
  }
}
