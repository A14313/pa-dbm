import { Test, TestingModule } from '@nestjs/testing';
import { BeanController } from './bean.controller';

describe('BeanController', () => {
  let controller: BeanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BeanController],
    }).compile();

    controller = module.get<BeanController>(BeanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
