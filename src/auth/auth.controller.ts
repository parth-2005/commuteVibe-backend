import { Body, Controller, Post } from '@nestjs/common'
import { AuthService } from './auth.service'
import { FirebaseAuthDto } from './dto/firebase-auth.dto'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: FirebaseAuthDto) {
    const result = await this.authService.verifyFirebaseToken(body.idToken)
    return { data: result, message: 'Login successful' }
  }
}
