// src/posts/posts.module.ts
import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { SupabaseStorageService } from 'src/services/SupabaseStorage.service';
import { PostFilesService } from '../post-files/post-files.service';
import { PostsController } from './posts.controller';

@Module({
  controllers: [PostsController],
  providers: [PostsService, PostFilesService, SupabaseStorageService],
  exports: [PostsService],
})
export class PostsModule {}
