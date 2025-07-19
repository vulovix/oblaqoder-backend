// src/post-files/post-files.module.ts
import { Module } from '@nestjs/common';
import { PostFilesService } from './post-files.service';
import { SupabaseStorageService } from '../../services/SupabaseStorage.service';
import { PostFilesController } from './post-files.controller';

@Module({
  imports: [],
  controllers: [PostFilesController],
  providers: [PostFilesService, SupabaseStorageService],
})
export class PostFilesModule {}
