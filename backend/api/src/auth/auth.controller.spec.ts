import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from 'src/users/dto/login.dto';
import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from 'src/users/schemas/user.schema';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    validateUser: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService
        }
      ]
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return access token and user data on successful login', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockResult = {
        accessToken: 'mock-jwt-token',
        user: {
          _id: '507f1f77bcf86cd799439011',
          email: 'test@example.com',
          name: 'Test User',
          role: UserRole.USER
        }
      };

      mockAuthService.login.mockResolvedValue(mockResult);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockResult);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(authService.login).toHaveBeenCalledTimes(1);
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      mockAuthService.login.mockRejectedValue(new UnauthorizedException('Credenciais inválidas'));

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should handle login with admin user', async () => {
      const loginDto: LoginDto = {
        email: 'admin@example.com',
        password: 'admin123'
      };

      const mockResult = {
        accessToken: 'mock-admin-jwt-token',
        user: {
          _id: '507f1f77bcf86cd799439012',
          email: 'admin@example.com',
          name: 'Admin User',
          role: UserRole.ADMIN
        }
      };

      mockAuthService.login.mockResolvedValue(mockResult);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockResult);
      expect(result.user.role).toBe(UserRole.ADMIN);
    });
  });
});
