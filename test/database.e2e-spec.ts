import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from './../src/app.module';
import { db } from '../src/configuration/db/index';
import {
  usersTable,
  postsTable,
  postFilesTable,
} from '../src/configuration/db/schema';
import { eq } from 'drizzle-orm';

describe('Database Operations (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should insert, update, and cascade delete users, posts, and files', async () => {
    // Insert user
    const [user] = await db
      .insert(usersTable)
      .values({ email: 'john@example.com' })
      .returning();
    console.log('User inserted:', user);
    expect(user).toBeDefined();
    const userId = user.id;

    // Insert post
    const [post] = await db
      .insert(postsTable)
      .values({ isPublic: true, content: 'Hello world!', userId })
      .returning();
    console.log('Post inserted:', post);
    const postId = post.id;

    // Insert file for post
    const [file] = await db
      .insert(postFilesTable)
      .values({
        postId,
        filePath: `uploads/post-${postId}/test-file.png`,
        bucket: 'post-files',
        mimeType: 'image/png',
        size: 12345,
      })
      .returning();
    console.log('File inserted for post:', file);
    expect(file).toBeDefined();

    // Verify file is linked to post
    const linkedFiles = await db
      .select()
      .from(postFilesTable)
      .where(eq(postFilesTable.postId, postId));
    console.log('Linked files for post:', linkedFiles);
    expect(linkedFiles.length).toBe(1);

    // Update post
    await db
      .update(postsTable)
      .set({ isPublic: false })
      .where(eq(postsTable.id, postId));
    const [updatedPost] = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.id, postId));
    console.log('Updated post:', updatedPost);
    expect(updatedPost.isPublic).toBe(false);

    // Delete post manually (cascade to file)
    await db.delete(postsTable).where(eq(postsTable.id, postId));
    console.log(`Post with ID ${postId} deleted.`);

    const orphanedFiles = await db
      .select()
      .from(postFilesTable)
      .where(eq(postFilesTable.postId, postId));
    console.log('Remaining files for deleted post:', orphanedFiles);
    expect(orphanedFiles.length).toBe(0);

    // Insert second post + file
    const [secondPost] = await db
      .insert(postsTable)
      .values({
        isPublic: true,
        content: 'To be deleted with user',
        userId,
      })
      .returning();
    const secondPostId = secondPost.id;

    const [insertedSecondFile] = await db
      .insert(postFilesTable)
      .values({
        postId: secondPostId,
        filePath: `uploads/post-${secondPostId}/file.png`,
        bucket: 'post-files',
        mimeType: 'image/png',
        size: 98765,
      })
      .returning();

    expect(insertedSecondFile).toBeDefined();
    console.log('Second post and file inserted.');

    // Delete user (should cascade to post and file)
    await db.delete(usersTable).where(eq(usersTable.id, userId));
    console.log(`User with ID ${userId} deleted (cascade expected).`);

    const remainingUsers = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));
    const remainingPosts = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.id, secondPostId));
    const remainingFiles = await db
      .select()
      .from(postFilesTable)
      .where(eq(postFilesTable.postId, secondPostId));

    console.log('Remaining users:', remainingUsers);
    console.log('Remaining posts:', remainingPosts);
    console.log('Remaining files:', remainingFiles);

    expect(remainingUsers.length).toBe(0);
    expect(remainingPosts.length).toBe(0);
    expect(remainingFiles.length).toBe(0);
  });
});
