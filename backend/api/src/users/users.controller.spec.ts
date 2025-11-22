import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './schemas/user.schema';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn()
  };

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.USER,
    createdAt: new Date('2025-11-22T10:00:00Z'),
    updatedAt: new Date('2025-11-22T10:00:00Z')
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService
        }
      ]
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        role: UserRole.USER
      };

      mockUsersService.create.mockResolvedValue({
        ...mockUser,
        email: createUserDto.email,
        name: createUserDto.name
      });

      const result = await controller.create(createUserDto);

      expect(result.email).toBe(createUserDto.email);
      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw ConflictException when email already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User'
      };

      mockUsersService.create.mockRejectedValue(new ConflictException('E-mail já está em uso'));

      await expect(controller.create(createUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const mockUsers = [mockUser, { ...mockUser, _id: '507f1f77bcf86cd799439012' }];
      mockUsersService.findAll.mockResolvedValue(mockUsers);

      const result = await controller.findAll();

      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(2);
      expect(usersService.findAll).toHaveBeenCalled();
    });

    it('should return an empty array when no users exist', async () => {
      mockUsersService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockUser);
      expect(usersService.findOne).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUsersService.findOne.mockRejectedValue(new NotFoundException('Usuário não encontrado'));

      await expect(controller.findOne('507f1f77bcf86cd799439099')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name'
      };

      const updatedUser = { ...mockUser, name: 'Updated Name' };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update('507f1f77bcf86cd799439011', updateUserDto);

      expect(result.name).toBe('Updated Name');
      expect(usersService.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateUserDto);
    });

    it('should update user role to ADMIN', async () => {
      const updateUserDto: UpdateUserDto = {
        role: UserRole.ADMIN
      };

      const updatedUser = { ...mockUser, role: UserRole.ADMIN };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update('507f1f77bcf86cd799439011', updateUserDto);

      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('should throw NotFoundException when updating non-existent user', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name'
      };

      mockUsersService.update.mockRejectedValue(new NotFoundException('Usuário não encontrado'));

      await expect(controller.update('507f1f77bcf86cd799439099', updateUserDto)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      mockUsersService.remove.mockResolvedValue(undefined);

      await controller.remove('507f1f77bcf86cd799439011');

      expect(usersService.remove).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException when removing non-existent user', async () => {
      mockUsersService.remove.mockRejectedValue(new NotFoundException('Usuário não encontrado'));

      await expect(controller.remove('507f1f77bcf86cd799439099')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
