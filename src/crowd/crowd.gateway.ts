import { Injectable } from '@nestjs/common'
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

@WebSocketGateway({ namespace: '/crowd', cors: { origin: '*' } })
@Injectable()
export class CrowdGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`)
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
