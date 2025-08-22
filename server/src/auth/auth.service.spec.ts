import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { KakaoClient } from './clients/kakao.client';
import { ConfigService } from '@nestjs/config';

const mockUserService = {} as any;
const mockJwtService = { sign: jest.fn(), verify: jest.fn() } as any;
const mockKakaoClient = { getUserMe: jest.fn() } as any;
const mockConfigService = { get: jest.fn() } as any;

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: KakaoClient, useValue: mockKakaoClient },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
