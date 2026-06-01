import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateRouteDto } from './dto/create-route.dto'

@Injectable()
export class RoutesService {
  constructor(private prisma: PrismaService) {}

  async createRoute(userId: string, dto: CreateRouteDto) {
    return this.prisma.route.create({ data: { userId, ...dto } })
  }

  async getUserRoutes(userId: string, limit = 20) {
    return this.prisma.route.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  async getRouteHistory(userId: string) {
    return this.getUserRoutes(userId, undefined as any)
  }
}
