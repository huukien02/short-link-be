import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { ClickEvent } from './click-event.entity';
import { Link } from './link.entity';
import { LinksCleanupService } from './links-cleanup.service';
import { LinksController } from './links.controller';
import { LinksService } from './links.service';

@Module({
  imports: [TypeOrmModule.forFeature([Link, ClickEvent]), UsersModule],
  controllers: [LinksController],
  providers: [LinksService, LinksCleanupService],
  exports: [LinksService],
})
export class LinksModule {}
