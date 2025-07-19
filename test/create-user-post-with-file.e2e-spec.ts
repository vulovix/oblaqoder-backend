import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from './../src/app.module';
import { SupabaseStorageService } from '../src/services/SupabaseStorage.service';
import { db } from '../src/configuration/db/index';
import {
  usersTable,
  postsTable,
  postFilesTable,
} from '../src/configuration/db/schema';
import { eq } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

describe('Create user, post and upload file (e2e)', () => {
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

  it('should create user, post, upload file, and record everything in DB + storage', async () => {
    console.log('\n🧪 Starting full flow test...');

    // Step 1: Create user
    const [user] = await db
      .insert(usersTable)
      .values({ email: `alice${Date.now()}@test.com` })
      .returning();
    expect(user).toBeDefined();
    console.log('✅ User created:', user);

    const userId = user.id;

    // Step 2: Upload file to Supabase Storage
    const filePath = resolve('test/assets/test.png');
    const fileBuffer = await readFile(filePath);
    const bucket = 'post-files';
    const storagePath = `uploads/user-${userId}/test-${Date.now()}.png`;

    const uploaded = await storageService.upload(
      bucket,
      fileBuffer,
      storagePath,
      'image/png',
    );
    expect(uploaded).toBeDefined();
    console.log('✅ File uploaded to storage:', uploaded);

    const publicUrl = storageService.getPublicUrl(bucket, storagePath);
    const signedUrl = await storageService.getSignedUrl(
      bucket,
      storagePath,
      60,
    );

    console.log('🌍 Public URL:', publicUrl);
    console.log('🔐 Signed URL:', signedUrl);

    // Step 3: Create post
    const [post] = await db
      .insert(postsTable)
      .values({
        content: 'Check out my image!',
        userId,
        isPublic: true,
      })
      .returning();
    expect(post).toBeDefined();
    console.log('✅ Post created:', post);

    const postId = post.id;

    // Step 4: Insert file reference into DB
    const [fileRecord] = await db
      .insert(postFilesTable)
      .values({
        postId,
        filePath: storagePath,
        bucket,
        mimeType: 'image/png',
        size: fileBuffer.length,
      })
      .returning();

    expect(fileRecord).toBeDefined();
    console.log('✅ File record inserted into DB:', fileRecord);

    // Step 5: Verify everything
    const [fetchedUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));
    expect(fetchedUser).toBeDefined();
    console.log('📦 Verified user in DB:', fetchedUser);

    const [fetchedPost] = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.id, postId));
    expect(fetchedPost).toBeDefined();
    console.log('📦 Verified post in DB:', fetchedPost);

    const filesLinkedToPost = await db
      .select()
      .from(postFilesTable)
      .where(eq(postFilesTable.postId, postId));
    expect(filesLinkedToPost.length).toBeGreaterThan(0);
    console.log('📦 Verified file(s) linked to post:', filesLinkedToPost);

    console.log(
      '\n✅ Test finished — all entities exist in DB and file uploaded to storage.\n',
    );
  });
});
