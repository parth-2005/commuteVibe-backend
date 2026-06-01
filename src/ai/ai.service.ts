import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import { RoutesService } from '../routes/routes.service'
import { CrowdService } from '../crowd/crowd.service'

@Injectable()
export class AiService {
  constructor(private routesService: RoutesService, private crowdService: CrowdService) {}

  async suggestRoute(userId: string, originLat: number, originLng: number, destLat: number, destLng: number) {
    try {
      const lastRoutes = await this.routesService.getUserRoutes(userId, 10)
      const nearby = await this.crowdService.getNearbyReports(originLat, originLng)

      // Placeholder simple suggestion: a single-leg WALK route
      const suggestion = {
        summary: 'Walk directly (placeholder suggestion)',
        totalDurationMin: Math.max(5, Math.round(this.haversineMin(originLat, originLng, destLat, destLng) / 5)),
        primaryMode: 'WALK',
        legs: [
          {
            mode: 'WALK',
            fromLabel: 'Origin',
            toLabel: 'Destination',
            fromLat: originLat,
            fromLng: originLng,
            toLat: destLat,
            toLng: destLng,
            durationMin: Math.max(5, Math.round(this.haversineMin(originLat, originLng, destLat, destLng) / 5)),
            reason: 'Placeholder: direct walk',
          },
        ],
        crowdWarning: nearby && nearby.length ? 'Some nearby reports exist' : null,
      }

      return suggestion
    } catch (err) {
      throw new ServiceUnavailableException('AI service currently unavailable')
    }
  }

  // crude estimate: 5 km/h ~ 83.33 m/min -> minutes = distance_km*1000 / 83.33
  private haversineMin(lat1: number, lon1: number, lat2: number, lon2: number) {
    const toRad = (v: number) => (v * Math.PI) / 180
    const R = 6371 // km
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distanceKm = R * c
    const minutes = (distanceKm * 1000) / 83.33
    return Math.round(minutes)
  }
}
