import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserStatus } from '../database/schemas/user.schema';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction } from '../database/schemas/audit-log.schema';
import { EventsGateway } from '../websocket/events.gateway';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const TelegramBotLib = require('node-telegram-bot-api');
const TelegramBot = TelegramBotLib.default || TelegramBotLib;

interface TelegramMessage {
  message_id?: number;
}

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private bot: any;
  private botUsername: string = 'IncidentHubBot';

  constructor(
    private configService: ConfigService,
    private auditLogsService: AuditLogsService,
    private eventsGateway: EventsGateway,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set — Telegram notifications disabled');
      return;
    }

    const webhookUrl = this.configService.get<string>('TELEGRAM_WEBHOOK_URL');
    const isWebhookMode = !!webhookUrl;

    // Enable polling when no external webhook URL is set (local dev)
    this.bot = new TelegramBot(token, { polling: !isWebhookMode });
    this.logger.log(`Telegram Bot initialized in ${isWebhookMode ? 'Webhook' : 'Polling'} mode`);
  }

  async onModuleInit() {
    if (!this.bot) return;

    try {
      const webhookUrl = this.configService.get<string>('TELEGRAM_WEBHOOK_URL');
      if (!webhookUrl) {
        // Clear any old webhook so polling works without conflict
        await this.bot.deleteWebhook().catch(() => {});
      }

      // Fetch dynamic bot username from Telegram API
      const me = await this.bot.getMe().catch(() => null);
      if (me && me.username) {
        this.botUsername = me.username;
        this.logger.log(`Telegram Bot authenticated as @${this.botUsername}`);
      }

      // Attach message handler for incoming Telegram commands (polling mode)
      this.bot.on('message', async (msg: any) => {
        await this.processIncomingMessage(msg);
      });
    } catch (err) {
      this.logger.error(`Error setting up Telegram Bot polling: ${err.message}`);
    }
  }

  getBotUsername(): string {
    return this.configService.get<string>('TELEGRAM_BOT_USERNAME') || this.botUsername;
  }

  async processIncomingMessage(message: any) {
    if (!message || !message.text) return;

    const text = message.text.trim();
    const chatId = String(message.chat.id);

    try {
      if (text.startsWith('/start ')) {
        const payload = text.replace('/start ', '').trim();
        const parsed = this.parseStartPayload(payload);

        if (parsed) {
          const user = await this.userModel.findById(parsed.userId).exec();
          if (user && user.status === UserStatus.APPROVED) {
            user.telegramChatId = chatId;
            user.telegramConnected = true;
            user.telegramConnectedAt = new Date();
            await user.save();

            await this.sendMessage(
              chatId,
              `✅ <b>Telegram Connected!</b>\n\nYour Telegram account has been successfully linked to <b>IncidentHub</b>. You will receive real-time incident notifications here.`,
            );

            await this.auditLogsService.log({
              actorId: user._id.toString(),
              action: AuditAction.TELEGRAM_CONNECTED,
              entityType: 'User',
              entityId: user._id.toString(),
              metadata: { chatId, email: user.email },
            });

            this.eventsGateway.server?.emit('telegram.connected', {
              userId: user._id,
              email: user.email,
            });
            this.eventsGateway.server?.emit('user.approved', { user });
          } else {
            await this.sendMessage(
              chatId,
              '❌ Invalid or expired connection link. Please generate a new link from your dashboard.',
            );
          }
        }
      } else if (text === '/start') {
        await this.sendMessage(
          chatId,
          '👋 Welcome to <b>IncidentHub Bot</b>!\n\nTo connect your Telegram account, please log in to your IncidentHub dashboard and click <b>"Connect Telegram"</b>.',
        );
      } else if (text === '/status') {
        const user = await this.userModel.findOne({ telegramChatId: chatId }).exec();
        if (user) {
          await this.sendMessage(
            chatId,
            `✅ Connected as <b>${user.name}</b> (${user.email})`,
          );
        } else {
          await this.sendMessage(
            chatId,
            '❌ Not connected. Please generate a link from your IncidentHub dashboard.',
          );
        }
      }
    } catch (err) {
      this.logger.error(`Error processing Telegram message: ${err.message}`);
    }
  }

  async sendMessage(chatId: string, text: string): Promise<TelegramMessage | null> {
    if (!this.bot) return null;
    try {
      return await this.bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
    } catch (error) {
      this.logger.error(`Failed to send Telegram message to ${chatId}: ${error.message}`);
      throw error;
    }
  }

  async sendApprovalMessage(chatId: string, userName: string): Promise<TelegramMessage | null> {
    const text = `✅ <b>Account Approved!</b>\n\nHello <b>${userName}</b>,\n\nYour IncidentHub account has been approved. You will now receive incident notifications here.\n\n🔔 Stay tuned for updates!`;
    return this.sendMessage(chatId, text);
  }

  async sendIncidentMessage(
    chatId: string,
    incident: { title: string; description: string; severity: string; status: string },
    isCritical = false,
  ): Promise<TelegramMessage | null> {
    const severityEmoji: Record<string, string> = {
      LOW: '🟢',
      MEDIUM: '🟡',
      HIGH: '🔴',
      CRITICAL: '🚨',
    };
    const emoji = severityEmoji[incident.severity] || '⚠️';

    let text: string;
    if (isCritical) {
      text =
        `🚨 <b>CRITICAL INCIDENT ALERT</b> 🚨\n\n` +
        `<b>⚡ ${incident.title}</b>\n\n` +
        `📋 <b>Description:</b>\n${incident.description}\n\n` +
        `🔥 <b>Severity:</b> CRITICAL — Immediate action required!\n` +
        `📊 <b>Status:</b> ${incident.status}\n\n` +
        `⏰ <b>Time:</b> ${new Date().toUTCString()}`;
    } else {
      text =
        `${emoji} <b>Incident Notification</b>\n\n` +
        `<b>${incident.title}</b>\n\n` +
        `📋 ${incident.description}\n\n` +
        `🏷️ <b>Severity:</b> ${incident.severity}\n` +
        `📊 <b>Status:</b> ${incident.status}\n` +
        `⏰ ${new Date().toUTCString()}`;
    }

    return this.sendMessage(chatId, text);
  }

  generateLinkToken(userId: string): string {
    return Buffer.from(`link:${userId}:${Date.now()}`).toString('base64url');
  }

  parseStartPayload(payload: string): { userId: string } | null {
    try {
      const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
      const parts = decoded.split(':');
      const userId = parts[1];
      if (userId) return { userId };
    } catch {}
    return null;
  }
}
