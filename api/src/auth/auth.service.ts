import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument, UserRole, UserStatus } from '../database/schemas/user.schema';

interface GoogleUserData {
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
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    
    // Check if user exists by googleId
    let user = await this.userModel.findOne({ googleId: userData.googleId }).exec();

    if (!user) {
      // Check if user with same email exists (e.g., first time OAuth)
      user = await this.userModel.findOne({ email: userData.email }).exec();
    }

    if (!user) {
      // Create new user
      const isAdmin = userData.email === adminEmail;
      user = new this.userModel({
        ...userData,
        role: isAdmin ? UserRole.ADMIN : UserRole.USER,
        status: isAdmin ? UserStatus.APPROVED : UserStatus.PENDING,
      });
      await user.save();
      this.logger.log(`New user created: ${userData.email} [${isAdmin ? 'ADMIN' : 'USER'}]`);
    } else {
      // Update existing user's Google profile info
      user.googleId = userData.googleId;
      user.name = userData.name;
      user.avatar = userData.avatar;
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

  async getMe(userId: string): Promise<UserDocument> {
    return this.userModel.findById(userId).exec();
  }
}
