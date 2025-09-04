import { Test, TestingModule } from '@nestjs/testing';
import { PhotoService } from './photo.service';
import { getModelToken } from '@nestjs/mongoose';
import { S3Service } from '../common/s3.service';

const mockPhotoModel = {
  findOne: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  create: jest.fn(),
};
const mockS3Service = {
  uploadObject: jest.fn(),
  deleteObject: jest.fn(),
  getSignedUrl: jest.fn(),
} as any;

describe('PhotoService', () => {
  let service: PhotoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhotoService,
        { provide: getModelToken('Photo'), useValue: mockPhotoModel },
        { provide: S3Service, useValue: mockS3Service },
      ],
    }).compile();

    service = module.get<PhotoService>(PhotoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
