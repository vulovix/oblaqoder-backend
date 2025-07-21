/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Injectable } from '@nestjs/common';
import { supabase } from '../configuration/supabase'; // Adjust path if needed
import { Blob } from 'buffer';

interface UploadedFileInfo {
  id: string;
  path: string;
  fullPath: string;
}

@Injectable()
export class SupabaseStorageService {
  async upload(
    bucket: string,
    buffer: Buffer,
    path: string,
    contentType = 'application/octet-stream',
  ): Promise<UploadedFileInfo> {
    const blob = new Blob([buffer], { type: contentType });

    const result = await supabase.storage.from(bucket).upload(path, blob, {
      upsert: true,
    });

    if (result.error !== null || result.data === null) {
      throw new Error(`Upload failed: ${result.error?.message}`);
    }

    return result.data; // { id, path, fullPath }
  }

  getPublicUrl(bucket: string, path: string): string {
    const result = supabase.storage.from(bucket).getPublicUrl(path);
    return result.data.publicUrl;
  }

  async getSignedUrl(
    bucket: string,
    path: string,
    //         sec min hour
    expiresIn = 60 * 60 * 1, // 1h
  ): Promise<string> {
    const result = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (result.error !== null || result.data === null) {
      throw new Error(`Signed URL generation failed: ${result.error?.message}`);
    }

    return result.data.signedUrl;
  }

  async delete(
    bucket: string,
    paths: string[],
  ): Promise<{ id: string; name: string }[]> {
    const result = await supabase.storage.from(bucket).remove(paths);

    if (result.error !== null || result.data === null) {
      throw new Error(`Delete failed: ${result.error?.message}`);
    }

    return result.data;
  }
  async getFolder(
    bucket: string,
    folder: string,
  ): Promise<{ id: string; name: string }[]> {
    const result = await supabase.storage.from(bucket).list(folder);

    if (result.error !== null || result.data === null) {
      throw new Error(`Delete failed: ${result.error?.message}`);
    }

    return result.data;
  }
}
