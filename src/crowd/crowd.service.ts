import { Injectable, TooManyRequestsException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateCrowdReportDto } from './dto/create-crowd-report.dto'

const LAT_DELTA = 0.0045
const LNG_DELTA = 0.0055

@Injectable()
export class CrowdService {
  constructor(private prisma: PrismaService) {}

  async createReport(userId: string, dto: CreateCrowdReportDto) {
    const last = await this.prisma.crowdReport.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    if (last && last.createdAt.getTime() > Date.now() - 5 * 60 * 1000) {
      throw new TooManyRequestsException('Report too soon. Wait 5 minutes.')
    }

    const report = await this.prisma.crowdReport.create({
      data: {
        userId,
        lat: dto.lat,
        lng: dto.lng,
        level: dto.level,
      },
    })

    return report
  }

  async getNearbyReports(lat: number, lng: number) {
    const since = new Date(Date.now() - 30 * 60 * 1000)
    const reports = await this.prisma.crowdReport.findMany({
      where: {
        lat: { gte: lat - LAT_DELTA, lte: lat + LAT_DELTA },
        lng: { gte: lng - LNG_DELTA, lte: lng + LNG_DELTA },
        createdAt: { gte: since },
      },
    })

    return reports
  }

  async getAreaLevel(lat: number, lng: number) {
    const reports = await this.getNearbyReports(lat, lng)
    if (!reports.length) return { level: 1, label: 'LOW', reportCount: 0 }

    const avg = reports.reduce((s, r) => s + r.level, 0) / reports.length
    const level = Math.round(avg)
    const label = level === 1 ? 'LOW' : level === 2 ? 'MEDIUM' : 'HIGH'

    return { level, label, reportCount: reports.length }
  }
}
