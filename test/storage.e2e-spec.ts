// test/storage.e2e-spec.ts
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from './../src/app.module';
import { SupabaseStorageService } from '../src/services/SupabaseStorage.service';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

describe('Supabase Storage (e2e)', () => {
  let app: INestApplication;
  let storageService: SupabaseStorageService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    storageService = app.get(SupabaseStorageService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should upload, get URL, and delete a file from Supabase Storage', async () => {
    const filePath = resolve('test/assets/test.png');
    const fileBuffer = await readFile(filePath);

    const bucket = 'post-files';
    const path = `uploads/test-${Date.now()}.png`;

    // Upload
    const uploaded = await storageService.upload(
      bucket,
      fileBuffer,
      path,
      'image/png',
    );
    expect(uploaded).toBeDefined();
    expect(uploaded.path).toBe(path);

    // Get public URL
    const publicUrl = storageService.getPublicUrl(bucket, path);
    console.log('Public URL:', publicUrl);
    expect(typeof publicUrl).toBe('string');
    expect(publicUrl).toContain(path);

    // Get signed URL
    const signedUrl = await storageService.getSignedUrl(bucket, path, 60);
    console.log('Signed URL:', signedUrl);
    expect(typeof signedUrl).toBe('string');

    // Delete
    const deleted = await storageService.delete(bucket, [path]);
    console.log('Deleted files:', deleted);
    expect(deleted.map((d) => d.name)).toContain(path);
  });
});
