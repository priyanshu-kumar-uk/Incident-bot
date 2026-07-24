import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole, UserStatus } from '../database/schemas/user.schema';
import { ConfigService } from '@nestjs/config';

export interface GoogleUserData {
  googleId: string;
  name: string;
  email: string;
  avatar: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async findOrCreateUser(userData: GoogleUserData): Promise<UserDocument> {
    const adminEmail = (this.configService.get<string>('ADMIN_EMAIL') || '').toLowerCase().trim();
    const userEmail = (userData.email || '').toLowerCase().trim();
    const isAdminEmail = adminEmail.length > 0 && userEmail === adminEmail;

    // Check if user exists by googleId
    let user = await this.userModel.findOne({ googleId: userData.googleId }).exec();

    if (!user) {
      // Check if user with same email exists (case-insensitive)
      user = await this.userModel.findOne({ email: new RegExp(`^${userEmail}$`, 'i') }).exec();
    }

    if (!user) {
      // Create new user
      user = new this.userModel({
        ...userData,
        email: userEmail,
        role: isAdminEmail ? UserRole.ADMIN : UserRole.USER,
        status: isAdminEmail ? UserStatus.APPROVED : UserStatus.PENDING,
      });
      await user.save();
      this.logger.log(`New user created: ${userData.email} [${isAdminEmail ? 'ADMIN' : 'USER'}]`);
    } else {
      // Update existing user's Google profile info
      user.googleId = userData.googleId;
      user.name = userData.name;
      user.avatar = userData.avatar;

      // Auto-promote to ADMIN if this email matches ADMIN_EMAIL
      if (isAdminEmail && (user.role !== UserRole.ADMIN || user.status !== UserStatus.APPROVED)) {
        user.role = UserRole.ADMIN;
        user.status = UserStatus.APPROVED;
        this.logger.log(`User promoted to ADMIN: ${userData.email}`);
      }

      await user.save();
    }

    return user;
  }

  generateJwt(user: UserDocument): string {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }
}
