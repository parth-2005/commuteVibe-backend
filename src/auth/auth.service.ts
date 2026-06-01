import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as admin from 'firebase-admin'
import { PrismaService } from '../prisma/prisma.service.js'

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {
    try {
      const apps = (admin as any).apps
      if (!apps || apps.length === 0) {
        if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
          })
        }
      }
    } catch (err) {
      // ignore initialization errors; verification will surface issues at runtime
    }
  }

  async verifyFirebaseToken(idToken: string) {
    let decoded: admin.auth.DecodedIdToken
    try {
      decoded = await admin.auth().verifyIdToken(idToken)
    } catch (err) {
      throw new UnauthorizedException('Invalid Firebase ID token')
    }

    const firebaseUid = decoded.uid
    const email = decoded.email ?? ''
    const name = (decoded.name || decoded.displayName) ?? ''

    const user = await this.prisma.user.upsert({
      where: { firebaseUid },
      update: { email, name },
      create: { firebaseUid, email, name },
    })

    const accessToken = this.jwtService.sign({ sub: user.id, email: user.email })

    return { accessToken, user }
  }
}
