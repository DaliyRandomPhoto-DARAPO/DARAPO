import { Test, TestingModule } from '@nestjs/testing';
import { MissionService } from './mission.service';
import { getModelToken } from '@nestjs/mongoose';

const mockMissionModel = {
  findOne: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  create: jest.fn(),
};

describe('MissionService', () => {
  let service: MissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MissionService,
        { provide: getModelToken('Mission'), useValue: mockMissionModel },
      ],
    }).compile();

    service = module.get<MissionService>(MissionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
