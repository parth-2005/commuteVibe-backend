import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets'
import { Server } from 'socket.io'

@WebSocketGateway({ namespace: '/crowd', cors: { origin: '*' } })
@Injectable()
export class CrowdGateway implements OnModuleInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  onModuleInit() {
    // gateway init
  }

  onGatewayConnection() {
    // client connected
  }

  onGatewayDisconnect() {
    // client disconnected
  }

  broadcastNewReport(report: any) {
    this.server.emit('crowd:update', {
      lat: report.lat,
      lng: report.lng,
      level: report.level,
      createdAt: report.createdAt,
    })
  }
}
