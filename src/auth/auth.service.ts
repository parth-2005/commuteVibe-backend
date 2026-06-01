import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as admin from 'firebase-admin'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {
    if (!admin.apps.length) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        })
      } catch (err) {
        // initialization can fail in some environments; allow verify to throw later
      }
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
