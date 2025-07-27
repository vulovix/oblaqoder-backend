import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  UploadedFiles,
  UseInterceptors,
  Get,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { PostFilesService } from './post-files.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MulterFile } from 'src/types/file';
import { JwtCookieAuthGuard } from 'src/guards/JwtCookieAuthGuard';

@Controller('post-files')
export class PostFilesController {
  constructor(private readonly filesService: PostFilesService) {}

  @UseGuards(JwtCookieAuthGuard)
  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFiles(
    @UploadedFiles() files: MulterFile[],
    @Query('postId', ParseIntPipe) postId: number,
  ) {
    return await this.filesService.uploadFilesForPost(postId, files, true); // return signed URLs
  }

  @UseGuards(JwtCookieAuthGuard)
  @Delete(':id')
  async deleteOne(@Param('id', ParseIntPipe) id: number) {
    await this.filesService.deleteFileById(id);
    return { deleted: true };
  }
  @UseGuards(JwtCookieAuthGuard)
  @Delete()
  async deleteMany(@Body() body: { ids: number[] }) {
    await this.filesService.deleteFilesByIds(body.ids);
    return { deleted: true };
  }
  @UseGuards(JwtCookieAuthGuard)
  @Get('by-post/:postId')
  async getByPost(@Param('postId', ParseIntPipe) postId: number) {
    return await this.filesService.getFilesForPost(postId);
  }
  @UseGuards(JwtCookieAuthGuard)
  @Delete('by-post/:postId')
  async deleteByPost(@Param('postId', ParseIntPipe) postId: number) {
    return await this.filesService.deleteFilesForPost(postId);
  }
}
