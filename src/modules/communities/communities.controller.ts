import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { PostsService } from '../posts/posts.service';
import { JwtCookieAuthGuard } from 'src/guards/JwtCookieAuthGuard';

@Controller('communities')
export class CommunitiesController {
  constructor(
    private readonly communitiesService: CommunitiesService,
    private readonly postsService: PostsService,
  ) {}

  @UseGuards(JwtCookieAuthGuard)
  @Post()
  create(@Body() dto: CreateCommunityDto) {
    return this.communitiesService.create(dto);
  }

  @Get()
  findAllPublic() {
    return this.communitiesService.findAllPublic();
  }

  @UseGuards(JwtCookieAuthGuard)
  @Get('all')
  findAll() {
    return this.communitiesService.findAll();
  }

  @UseGuards(JwtCookieAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.communitiesService.findOne(+id);
  }

  @UseGuards(JwtCookieAuthGuard)
  @Get(':id/user')
  findOneWithUser(@Param('id') id: string) {
    return this.communitiesService.findOneWithUser(+id);
  }

  @UseGuards(JwtCookieAuthGuard)
  @Get('user/:userId')
  findAllByUser(@Param('userId') userId: string) {
    return this.communitiesService.findAllByUser(+userId);
  }

  @UseGuards(JwtCookieAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCommunityDto) {
    return this.communitiesService.update(+id, dto);
  }

  @UseGuards(JwtCookieAuthGuard)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.communitiesService.delete(+id);
  }

  @UseGuards(JwtCookieAuthGuard)
  @Get(':id/posts')
  getPosts(@Param('id') id: string) {
    return this.postsService.getPostsByCommunity(+id);
  }
}
