import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { CreateAlarmDto } from './dto/create-alarm.dto.js'
import { UpdateAlarmDto } from './dto/update-alarm.dto.js'

@Injectable()
export class AlarmsService {
  constructor(private prisma: PrismaService) {}

  async upsertAlarm(userId: string, dto: CreateAlarmDto) {
    return this.prisma.alarm.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: { ...dto, isActive: true },
    })
  }

  async getAlarm(userId: string) {
    return this.prisma.alarm.findUnique({ where: { userId } })
  }

  async updateAlarm(userId: string, dto: UpdateAlarmDto) {
    const alarm = await this.prisma.alarm.findUnique({ where: { userId } })
    if (!alarm) throw new NotFoundException('Alarm not found')
    return this.prisma.alarm.update({ where: { userId }, data: dto })
  }

  async deleteAlarm(userId: string) {
    await this.prisma.alarm.delete({ where: { userId } })
    return { success: true }
  }
}
