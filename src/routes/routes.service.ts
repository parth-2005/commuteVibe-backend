import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { CreateRouteDto } from './dto/create-route.dto.js'
import type { Prisma } from '@prisma/client'

@Injectable()
export class RoutesService {
  constructor(private prisma: PrismaService) {}

  async createRoute(userId: string, dto: CreateRouteDto) {
    return this.prisma.route.create({
      data: {
        userId,
        originLat: dto.originLat,
        originLng: dto.originLng,
        destLat: dto.destLat,
        destLng: dto.destLng,
        legs: dto.legs as unknown as Prisma.InputJsonValue,
        transitMode: dto.transitMode,
        durationMin: dto.durationMin,
        chosenByAi: dto.chosenByAi,
      },
    })
  }

  async getUserRoutes(userId: string, limit = 20) {
    return this.prisma.route.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  async getRouteHistory(userId: string) {
    return this.prisma.route.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  }
}
