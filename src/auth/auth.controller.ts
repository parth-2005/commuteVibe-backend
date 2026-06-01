import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service.js'
import { FirebaseAuthDto } from './dto/firebase-auth.dto.js'
import { JwtGuard } from './guards/jwt.guard.js'
import { CurrentUser } from '../common/decorators/current-user.decorator.js'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: FirebaseAuthDto) {
    const result = await this.authService.verifyFirebaseToken(body.idToken)
    return { data: result, message: 'Login successful' }
  }

  @Get('me')
  @UseGuards(JwtGuard)
  async me(@CurrentUser() user: any) {
    return { data: user, message: 'Success' }
  }
}
