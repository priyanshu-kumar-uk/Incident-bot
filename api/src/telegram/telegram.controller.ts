import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserDocument, UserStatus } from '../database/schemas/user.schema';

@Controller('telegram')
export class TelegramController {
  constructor(private telegramService: TelegramService) {}

  @Get('connect')
  @UseGuards(JwtAuthGuard)
  async getTelegramConnectLink(@CurrentUser() user: UserDocument) {
    if (user.status !== UserStatus.APPROVED) {
      return { error: 'Only approved users can connect Telegram' };
    }
    const token = this.telegramService.generateLinkToken(user._id.toString());
    const botUsername = this.telegramService.getBotUsername();
    const link = `https://t.me/${botUsername}?start=${token}`;
    return {
      link,
      botUsername,
      instructions: 'Click the link and click START in Telegram to connect your account.',
    };
  }

  @Post('webhook')
  async handleWebhook(@Body() update: Record<string, unknown>) {
    try {
      const message = update.message;
      if (message) {
        await this.telegramService.processIncomingMessage(message);
      }
    } catch (err) {
      console.error('Telegram webhook error:', err);
    }
    return { ok: true };
  }
}
