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
import { CategoriesService } from './categories.service';
import { PostsService } from '../posts/posts.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtCookieAuthGuard } from 'src/guards/JwtCookieAuthGuard';

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly postsService: PostsService,
  ) {}

  @UseGuards(JwtCookieAuthGuard)
  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Get()
  findAllPublic() {
    return this.categoriesService.findAllPublic();
  }

  @UseGuards(JwtCookieAuthGuard)
  @Get('all')
  findAll() {
    return this.categoriesService.findAll();
  }

  @UseGuards(JwtCookieAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(+id);
  }

  @UseGuards(JwtCookieAuthGuard)
  @Get(':id/user')
  findOneWithUser(@Param('id') id: string) {
    return this.categoriesService.findOneWithUser(+id);
  }

  @UseGuards(JwtCookieAuthGuard)
  @Get('user/:userId')
  findAllByUser(@Param('userId') userId: string) {
    return this.categoriesService.findAllByUser(+userId);
  }

  @UseGuards(JwtCookieAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(+id, dto);
  }

  @UseGuards(JwtCookieAuthGuard)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.categoriesService.delete(+id);
  }

  @UseGuards(JwtCookieAuthGuard)
  @Get(':id/posts')
  getPosts(@Param('id') id: string) {
    return this.postsService.getPostsByCategory(+id);
  }
}
