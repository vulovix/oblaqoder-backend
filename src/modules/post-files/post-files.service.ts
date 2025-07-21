// src/post-files/post-files.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { SupabaseStorageService } from '../../services/SupabaseStorage.service';
import { db } from '../../configuration/db';
import { postFilesTable } from '../../configuration/db/schema';
import { InsertPostFile } from '../../configuration/db/schema';
import { MulterFile } from 'src/types/file';
import { eq, inArray } from 'drizzle-orm';

@Injectable()
export class PostFilesService {
  constructor(private readonly storage: SupabaseStorageService) {}

  async deleteFilesForPost(postId: number) {
    const files = await db
      .select()
      .from(postFilesTable)
      .where(eq(postFilesTable.postId, postId));

    if (!files.length) {
      return;
    }

    const filePaths = files.map((file) => file.filePath);
    // Delete from Supabase
    await this.storage.delete('post-files', filePaths);

    // Delete metadata from DB
    await db.delete(postFilesTable).where(eq(postFilesTable.postId, postId));
  }

  async deleteFileById(fileId: number) {
    const file = await db
      .select()
      .from(postFilesTable)
      .where(eq(postFilesTable.id, fileId))
      .then((res) => res[0]);

    if (!file) {
      throw new Error('File not found');
    }

    await this.storage.delete(file.bucket, [file.filePath]);

    await db.delete(postFilesTable).where(eq(postFilesTable.id, fileId));
  }

  async deleteFilesByIds(fileIds: number[]) {
    if (fileIds.length === 0) return;

    const files = await db
      .select()
      .from(postFilesTable)
      .where(inArray(postFilesTable.id, fileIds));

    if (!files.length) return;

    const paths = files.map((f) => f.filePath);
    const bucket = files[0].bucket; // assuming same bucket

    await this.storage.delete(bucket, paths);

    await db.delete(postFilesTable).where(inArray(postFilesTable.id, fileIds));
  }

  async uploadFilesForPost(
    postId: number,
    files: MulterFile[],
    returnSigned = true,
  ) {
    const insertedFiles: InsertPostFile[] = [];

    for (const file of files) {
      if (file) {
        const path = `posts/${postId}/${Date.now()}-${file.originalname}`;
        await this.storage.upload(
          'post-files',
          file.buffer,
          path,
          file.mimetype,
        );

        insertedFiles.push({
          postId,
          filePath: path,
          bucket: 'post-files',
          mimeType: file.mimetype,
          size: file.size,
        });
      }
    }

    const savedFiles = await db
      .insert(postFilesTable)
      .values(insertedFiles)
      .returning();

    if (returnSigned) {
      return await Promise.all(
        savedFiles.map(async (f) => ({
          ...f,
          publicUrl: await this.storage.getSignedUrl(f.bucket, f.filePath),
        })),
      );
    }

    return savedFiles;
  }

  async getFilesForPost(postId: number) {
    const files = await db
      .select()
      .from(postFilesTable)
      .where(eq(postFilesTable.postId, postId));

    return await Promise.all(
      files.map(async (f) => ({
        ...f,
        publicUrl: await this.storage.getSignedUrl(f.bucket, f.filePath, 3600),
      })),
    );
  }
}
