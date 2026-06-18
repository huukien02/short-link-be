import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClickEvent } from '../links/click-event.entity';
import { LinksModule } from '../links/links.module';
import { RedirectController } from './redirect.controller';
import { RedirectService } from './redirect.service';

@Module({
  imports: [TypeOrmModule.forFeature([ClickEvent]), LinksModule],
  controllers: [RedirectController],
  providers: [RedirectService],
})
export class RedirectModule {}
