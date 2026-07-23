import { Controller, Get, Post, Req, Res, UseGuards, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserDocument } from '../database/schemas/user.schema';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as UserDocument;
    const token = this.authService.generateJwt(user);
    const frontendUrl = (
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173'
    ).replace(/\/$/, '');

    const isHttps = frontendUrl.startsWith('https://') || process.env.NODE_ENV === 'production';

    // Set JWT token in HttpOnly Cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: isHttps ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Pass token as fallback query param for browsers blocking third-party cross-site cookies
    return res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const frontendUrl = (
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173'
    ).replace(/\/$/, '');

    const isHttps = frontendUrl.startsWith('https://') || process.env.NODE_ENV === 'production';

    res.clearCookie('token', {
      httpOnly: true,
      secure: isHttps,
      sameSite: isHttps ? 'none' : 'lax',
    });
    return res.status(HttpStatus.OK).json({ message: 'Logged out successfully' });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: UserDocument) {
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      telegramConnected: user.telegramConnected || false,
      telegramChatId: user.telegramChatId || null,
      createdAt: user.createdAt,
    };
  }
}
