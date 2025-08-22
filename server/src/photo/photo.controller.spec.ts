import { Test, TestingModule } from '@nestjs/testing';
import { PhotoController } from './photo.controller';
import { PhotoService } from './photo.service';
import { S3Service } from '../common/s3.service';

const mockPhotoService = {} as any;
const mockS3Service = {} as any;

describe('PhotoController', () => {
  let controller: PhotoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PhotoController],
      providers: [
        { provide: PhotoService, useValue: mockPhotoService },
        { provide: S3Service, useValue: mockS3Service },
      ],
    }).compile();

    controller = module.get<PhotoController>(PhotoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
