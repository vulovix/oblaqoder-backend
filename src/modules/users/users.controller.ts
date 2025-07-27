import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PostsService } from '../posts/posts.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
  ) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Post('/email')
  findOneByEmail(
    @Body('email') email: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.usersService.findOneByEmail(email, res);
  }

  @Post('/logout')
  logout(@Res({ passthrough: true }) res: Response) {
    return this.usersService.logout(res);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(+id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.usersService.delete(+id);
  }

  @Get(':id/posts')
  getPosts(@Param('id') id: string) {
    return this.postsService.getPostsByCommunity(+id);
  }
}
