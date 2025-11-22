import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserRole } from './schemas/user.schema';
import { Model } from 'mongoose';
import { envConfig } from 'src/config/env.config';
import bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ErrorMessages, InfoMessages, formatMessage } from 'src/common/messages';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>
  ) {}
  async onModuleInit() {
    const email = envConfig.defaultAdminEmail;
    const password = envConfig.defaultAdminPassword;

    if (!email || !password) {
      this.logger.warn(InfoMessages.ADMIN_SEED_SKIPPED);
      return;
    }

    const exists = await this.userModel.findOne({ email }).exec();
    if (exists) return;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await this.userModel.create({
      email,
      password: hashedPassword,
      name: 'Admin',
      role: UserRole.ADMIN
    });

    this.logger.log(formatMessage(InfoMessages.ADMIN_SEED_SUCCESS, email));
  }

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.userModel.findOne({ email: dto.email }).exec();
    if (existing) {
      throw new ConflictException(ErrorMessages.USER_EMAIL_IN_USE);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const createdUser = new this.userModel({
      ...dto,
      password: hashedPassword
    });
    return createdUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-password').exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const updateData: Partial<User> = { ...dto };

    if (dto.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(dto.password, salt);
    }

    const updated = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select('-password')
      .exec();

    if (!updated) throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const res = await this.userModel.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
  }
}
