import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { PostsService } from '../posts/posts.service';

@Controller('communities')
export class CommunitiesController {
  constructor(
    private readonly communitiesService: CommunitiesService,
    private readonly postsService: PostsService,
  ) {}

  @Post()
  create(@Body() dto: CreateCommunityDto) {
    return this.communitiesService.create(dto);
  }

  @Get()
  findAllPublic() {
    return this.communitiesService.findAllPublic();
  }

  @Get('all')
  findAll() {
    return this.communitiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.communitiesService.findOne(+id);
  }

  @Get(':id/user')
  findOneWithUser(@Param('id') id: string) {
    return this.communitiesService.findOneWithUser(+id);
  }

  @Get('user/:userId')
  findAllByUser(@Param('userId') userId: string) {
    return this.communitiesService.findAllByUser(+userId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCommunityDto) {
    return this.communitiesService.update(+id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.communitiesService.delete(+id);
  }

  @Get(':id/posts')
  getPosts(@Param('id') id: string) {
    return this.postsService.getPostsByCommunity(+id);
  }
}
