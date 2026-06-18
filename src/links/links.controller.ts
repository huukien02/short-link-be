import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateLinkDto } from './dto/create-link.dto';
import { ListLinksDto } from './dto/list-links.dto';
import { UpdateLinkDto } from './dto/update-link.dto';
import { Link } from './link.entity';
import { LinksService } from './links.service';

@UseGuards(JwtAuthGuard)
@Controller('links')
export class LinksController {
  constructor(
    private readonly links: LinksService,
    private readonly config: ConfigService,
  ) {}

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateLinkDto) {
    const link = await this.links.create(user.id, dto);
    return this.withShortUrl(link);
  }

  @Get()
  async list(@CurrentUser() user: AuthUser, @Query() query: ListLinksDto) {
    const result = await this.links.findAllByOwner(user.id, query);
    return {
      ...result,
      items: result.items.map((l) => this.withShortUrl(l)),
    };
  }

  @Get(':id')
  async getOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const link = await this.links.findOneOwned(user.id, id);
    return this.withShortUrl(link);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLinkDto,
  ) {
    const link = await this.links.update(user.id, id, dto);
    return this.withShortUrl(link);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.links.remove(user.id, id);
  }

  /** Gắn thêm shortUrl đầy đủ để frontend hiển thị/copy. */
  private withShortUrl(link: Link) {
    const base = this.config.get<string>(
      'SHORT_BASE_URL',
      'http://localhost:3001',
    );
    return { ...link, shortUrl: `${base}/r/${link.slug}` };
  }
}
