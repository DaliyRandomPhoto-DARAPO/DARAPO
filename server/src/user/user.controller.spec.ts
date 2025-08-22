import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { S3Service } from '../common/s3.service';
import { PhotoService } from '../photo/photo.service';

const mockUserService = {} as any;
const mockS3Service = {} as any;
const mockPhotoService = {} as any;

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: S3Service, useValue: mockS3Service },
        { provide: PhotoService, useValue: mockPhotoService },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
