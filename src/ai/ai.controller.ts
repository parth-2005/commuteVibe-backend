import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { AiService } from './ai.service.js'
import { IsNumber } from 'class-validator'
import { JwtGuard } from '../auth/guards/jwt.guard.js'
import { CurrentUser } from '../common/decorators/current-user.decorator.js'

class SuggestRouteDto {
  @IsNumber()
  originLat: number

  @IsNumber()
  originLng: number

  @IsNumber()
  destLat: number

  @IsNumber()
  destLng: number
}

@Controller('ai')
@UseGuards(JwtGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('suggest-route')
  async suggestRoute(@CurrentUser() user: any, @Body() dto: SuggestRouteDto) {
    const suggestion = await this.aiService.suggestRoute(
      user.id,
      dto.originLat,
      dto.originLng,
      dto.destLat,
      dto.destLng,
    )

    return { data: suggestion, message: 'Route suggested' }
  }
}
