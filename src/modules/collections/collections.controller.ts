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
import { CollectionsService } from './collections.service';
import { PostsService } from '../posts/posts.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { JwtCookieAuthGuard } from 'src/guards/JwtCookieAuthGuard';

@Controller('collections')
export class CollectionsController {
  constructor(
    private readonly collectionsService: CollectionsService,
    private readonly postsService: PostsService,
  ) {}

  @Post()
  create(@Body() dto: CreateCollectionDto) {
    return this.collectionsService.create(dto);
  }

  @Get()
  findAllPublic() {
    return this.collectionsService.findAllPublic();
  }

  @UseGuards(JwtCookieAuthGuard)
  @Get('all')
  findAll() {
    return this.collectionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.collectionsService.findOne(+id);
  }

  @Get(':id/user')
  findOneWithUser(@Param('id') id: string) {
    return this.collectionsService.findOneWithUser(+id);
  }

  @Get('user/:userId')
  findAllByUser(@Param('userId') userId: string) {
    return this.collectionsService.findAllByUser(+userId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCollectionDto) {
    return this.collectionsService.update(+id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.collectionsService.delete(+id);
  }

  @Get(':id/posts')
  getPosts(@Param('id') id: string) {
    return this.postsService.getPostsByCollection(+id);
  }
}
