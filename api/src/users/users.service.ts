import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserStatus } from '../database/schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByStatus(status: UserStatus, search?: string, page = 1, limit = 20) {
    const query: Record<string, unknown> = { status };

    if (search) {
      query['$or'] = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.userModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.userModel.countDocuments(query).exec(),
    ]);

    return { users, total, page, limit };
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async approveUser(id: string): Promise<UserDocument> {
    const user = await this.findById(id);
    user.status = UserStatus.APPROVED;
    await user.save();
    return user;
  }

  async rejectUser(id: string): Promise<UserDocument> {
    const user = await this.findById(id);
    user.status = UserStatus.REJECTED;
    await user.save();
    return user;
  }

  async getPendingUsers(search?: string, page?: number, limit?: number) {
    return this.findByStatus(UserStatus.PENDING, search, page, limit);
  }

  async getApprovedUsers(search?: string, page?: number, limit?: number) {
    return this.findByStatus(UserStatus.APPROVED, search, page, limit);
  }

  async getRejectedUsers(search?: string, page?: number, limit?: number) {
    return this.findByStatus(UserStatus.REJECTED, search, page, limit);
  }

  async countByStatus(status: UserStatus): Promise<number> {
    return this.userModel.countDocuments({ status }).exec();
  }
}
