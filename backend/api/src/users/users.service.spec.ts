import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserRole } from './schemas/user.schema';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test User',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockSave = jest.fn();
  const mockUserModel: any = jest.fn().mockImplementation((dto) => ({
    ...dto,
    save: mockSave
  }));

  mockUserModel.findOne = jest.fn();
  mockUserModel.find = jest.fn();
  mockUserModel.findById = jest.fn();
  mockUserModel.findByIdAndUpdate = jest.fn();
  mockUserModel.findByIdAndDelete = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel
        }
      ]
    }).compile();

    service = module.get<UsersService>(UsersService);

    // Skip onModuleInit to avoid admin seeding in tests
    jest.spyOn(service, 'onModuleInit').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User'
      };

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const mockSavedUser = {
        ...createUserDto,
        _id: '507f1f77bcf86cd799439011',
        password: 'hashedPassword',
        role: UserRole.USER
      };

      mockSave.mockResolvedValue(mockSavedUser);

      const result = await service.create(createUserDto);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'salt');
      expect(mockSave).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw ConflictException when email already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User'
      };

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser)
      });

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createUserDto)).rejects.toThrow('E-mail já está em uso');
    });
  });

  describe('findAll', () => {
    it('should return array of users without passwords', async () => {
      const users = [mockUser, { ...mockUser, _id: '507f1f77bcf86cd799439012' }];

      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(users)
        })
      });

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(mockUserModel.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id without password', async () => {
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUser)
        })
      });

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null)
        })
      });

      await expect(service.findOne('507f1f77bcf86cd799439099')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return user with password when found', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser)
      });

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: 'test@example.com'
      });
    });

    it('should return null when user not found', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user without password change', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name'
      };

      const updatedUser = { ...mockUser, name: 'Updated Name' };

      mockUserModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(updatedUser)
        })
      });

      const result = await service.update('507f1f77bcf86cd799439011', updateUserDto);

      expect(result.name).toBe('Updated Name');
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('should update user with hashed password when password provided', async () => {
      const updateUserDto: UpdateUserDto = {
        password: 'newPassword123'
      };

      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');

      mockUserModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ ...mockUser })
        })
      });

      await service.update('507f1f77bcf86cd799439011', updateUserDto);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 'salt');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name'
      };

      mockUserModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null)
        })
      });

      await expect(service.update('507f1f77bcf86cd799439099', updateUserDto)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('remove', () => {
    it('should remove a user successfully', async () => {
      mockUserModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser)
      });

      await service.remove('507f1f77bcf86cd799439011');

      expect(mockUserModel.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUserModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      await expect(service.remove('507f1f77bcf86cd799439099')).rejects.toThrow(NotFoundException);
    });
  });
});
