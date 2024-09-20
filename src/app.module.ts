import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BeanController } from './bean/bean.controller';
import { BeanService } from './bean/bean.service';
import { NestjsFormDataModule, MemoryStoredFile } from 'nestjs-form-data';

@Module({
  imports: [NestjsFormDataModule.config({ storage: MemoryStoredFile })],
  controllers: [AppController, BeanController],
  providers: [AppService, BeanService],
})
export class AppModule { }
