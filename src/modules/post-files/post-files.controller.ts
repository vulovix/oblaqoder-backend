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
} from '@nestjs/common';
import { PostFilesService } from './post-files.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MulterFile } from 'src/types/file';

@Controller('post-files')
export class PostFilesController {
  constructor(private readonly filesService: PostFilesService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFiles(
    @UploadedFiles() files: MulterFile[],
    @Query('postId', ParseIntPipe) postId: number,
  ) {
    return await this.filesService.uploadFilesForPost(postId, files, true); // return signed URLs
  }

  @Delete(':id')
  async deleteOne(@Param('id', ParseIntPipe) id: number) {
    await this.filesService.deleteFileById(id);
    return { deleted: true };
  }

  @Delete()
  async deleteMany(@Body() body: { ids: number[] }) {
    await this.filesService.deleteFilesByIds(body.ids);
    return { deleted: true };
  }

  @Get('by-post/:postId')
  async getByPost(@Param('postId', ParseIntPipe) postId: number) {
    return await this.filesService.getFilesForPost(postId);
  }
}
