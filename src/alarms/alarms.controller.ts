import { Body, Controller, Delete, Get, Patch, Post, UseGuards } from '@nestjs/common'
import { AlarmsService } from './alarms.service'
import { CreateAlarmDto } from './dto/create-alarm.dto'
import { UpdateAlarmDto } from './dto/update-alarm.dto'
import { JwtGuard } from '../auth/guards/jwt.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@Controller('alarms')
@UseGuards(JwtGuard)
export class AlarmsController {
  constructor(private alarmsService: AlarmsService) {}

  @Post()
  async create(@CurrentUser() user: any, @Body() dto: CreateAlarmDto) {
    const alarm = await this.alarmsService.upsertAlarm(user.id, dto)
    return { data: alarm, message: 'Alarm created' }
  }

  @Get()
  async get(@CurrentUser() user: any) {
    const alarm = await this.alarmsService.getAlarm(user.id)
    return { data: alarm, message: 'Success' }
  }

  @Patch()
  async update(@CurrentUser() user: any, @Body() dto: UpdateAlarmDto) {
    const alarm = await this.alarmsService.updateAlarm(user.id, dto)
    return { data: alarm, message: 'Alarm updated' }
  }

  @Delete()
  async remove(@CurrentUser() user: any) {
    const res = await this.alarmsService.deleteAlarm(user.id)
    return { data: res, message: 'Alarm deleted' }
  }
}
