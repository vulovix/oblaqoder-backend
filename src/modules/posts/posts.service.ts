// src/posts/posts.service.ts
import { Injectable } from '@nestjs/common';
import { db } from '../../configuration/db';
import { postsTable } from '../../configuration/db/schema';
import { CreatePostDto } from './dto/create-post.dto';
import { eq } from 'drizzle-orm';
import { InsertPost } from '../../configuration/db/schema';
import { SupabaseStorageService } from 'src/services/SupabaseStorage.service';
import {
  postCategoriesTable,
  postCommunitiesTable,
  postCollectionsTable,
} from '../../configuration/db/schema';

@Injectable()
export class PostsService {
  constructor(private readonly storage: SupabaseStorageService) {}

  async createPost(dto: CreatePostDto) {
    const [post] = await db
      .insert(postsTable)
      .values({
        content: dto.content,
        userId: dto.userId,
        isPublic: dto.isPublic,
      } satisfies InsertPost)
      .returning();

    return await db.query.postsTable.findFirst({
      with: {
        files: true,
        user: {
          columns: {
            id: true,
            name: true,
          },
        },
        categories: {
          columns: {},
          with: {
            category: true,
          },
        },
        collections: {
          columns: {},
          with: {
            collection: true,
          },
        },
        communities: {
          columns: {},
          with: {
            community: true,
          },
        },
      },
      where: eq(postsTable.id, post.id),
    });
  }

  async getPostById(id: number) {
    const post = await db.query.postsTable.findFirst({
      where: eq(postsTable.id, id),
      with: {
        files: true,
        user: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!post) return null;

    const filesWithUrls = await Promise.all(
      post.files.map(async (file) => ({
        ...file,
        publicUrl: await this.storage.getSignedUrl(file.bucket, file.filePath),
      })),
    );

    return {
      ...post,
      files: filesWithUrls,
    };
  }

  async getPosts() {
    const posts = await db.query.postsTable.findMany({
      with: {
        files: true,
      },
    });

    return await Promise.all(
      posts.map(async (post) => {
        const filesWithUrls = await Promise.all(
          post.files.map(async (file) => ({
            ...file,
            publicUrl: await this.storage.getSignedUrl(
              file.bucket,
              file.filePath,
            ),
          })),
        );

        return {
          ...post,
          files: filesWithUrls,
        };
      }),
    );
  }

  async getCalendarPosts(includeHiddenSources: boolean = false) {
    const posts = await db.query.postsTable.findMany({
      columns: {
        id: true,
        createdAt: true,
        isPublic: true,
      },
      with: {
        categories: {
          columns: {},
          with: {
            category: {
              columns: {
                isPublic: true,
              },
            },
          },
        },
        collections: {
          columns: {},
          with: {
            collection: {
              columns: {
                isPublic: true,
              },
            },
          },
        },
        communities: {
          columns: {},
          with: {
            community: {
              columns: {
                isPublic: true,
              },
            },
          },
        },
      },
    });

    const filtered = includeHiddenSources
      ? posts
      : posts.filter((post) => {
          if (post.isPublic === false) return false;

          const hasHiddenCategory = post.categories?.some(
            (c) => c.category?.isPublic === false,
          );
          const hasHiddenCollection = post.collections?.some(
            (c) => c.collection?.isPublic === false,
          );
          const hasHiddenCommunity = post.communities?.some(
            (c) => c.community?.isPublic === false,
          );

          const hasHiddenRelation =
            hasHiddenCategory || hasHiddenCollection || hasHiddenCommunity;

          return !hasHiddenRelation;
        });

    return filtered.map((post) => ({
      createdAt: post.createdAt,
    }));
  }

  async getPaginatedPosts(limit: number, offset: number) {
    const posts = await db.query.postsTable.findMany({
      with: {
        files: true,
      },
      limit,
      offset,
      orderBy: (posts, { desc }) => [desc(posts.createdAt)],
    });

    return await Promise.all(
      posts.map(async (post) => {
        const filesWithUrls = await Promise.all(
          post.files.map(async (file) => ({
            ...file,
            publicUrl: await this.storage.getSignedUrl(
              file.bucket,
              file.filePath,
            ),
          })),
        );

        return {
          ...post,
          files: filesWithUrls,
        };
      }),
    );
  }

  async getPaginatedPostsByDate(
    limit: number,
    offset: number,
    date?: string,
    includeHiddenSources: boolean = false,
  ) {
    const posts = await db.query.postsTable.findMany({
      with: {
        files: true,
        user: {
          columns: {
            id: true,
            name: true,
          },
        },
        categories: {
          columns: {},
          with: {
            category: true,
          },
        },
        collections: {
          columns: {},
          with: {
            collection: true,
          },
        },
        communities: {
          columns: {},
          with: {
            community: true,
          },
        },
      },
      where: date
        ? (post, { and, gte, lt }) =>
            and(
              gte(post.createdAt, new Date(`${date}T00:00:00.000Z`)),
              lt(post.createdAt, new Date(`${date}T23:59:59.999Z`)),
            )
        : undefined,
      limit,
      offset,
      orderBy: (posts, { desc }) => [desc(posts.createdAt)],
    });

    const filtered = includeHiddenSources
      ? posts
      : posts.filter((post) => {
          if (post.isPublic === false) return false;

          const hasHiddenCategory = post.categories?.some(
            (c) => c.category?.isPublic === false,
          );
          const hasHiddenCollection = post.collections?.some(
            (c) => c.collection?.isPublic === false,
          );
          const hasHiddenCommunity = post.communities?.some(
            (c) => c.community?.isPublic === false,
          );

          const hasHiddenRelation =
            hasHiddenCategory || hasHiddenCollection || hasHiddenCommunity;

          return !hasHiddenRelation;
        });
    return Promise.all(
      filtered.map(async (post) => ({
        ...post,
        files: await Promise.all(
          post.files.map(async (file) => ({
            ...file,
            publicUrl: await this.storage.getSignedUrl(
              file.bucket,
              file.filePath,
            ),
          })),
        ),
        categories: post.categories.map((pc) => pc.category),
        collections: post.collections.map((pc) => pc.collection),
        communities: post.communities.map((pc) => pc.community),
      })),
    );
  }

  async deletePost(id: number) {
    return db.delete(postsTable).where(eq(postsTable.id, id));
  }

  async updatePost(id: number, update: Partial<InsertPost>) {
    return db
      .update(postsTable)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(postsTable.id, id))
      .returning();
  }

  async getPostsByCategory(categoryId: number) {
    const postIds = await db
      .select({ postId: postCategoriesTable.postId })
      .from(postCategoriesTable)
      .where(eq(postCategoriesTable.categoryId, categoryId));

    const ids = postIds.map((r) => r.postId);
    const posts = await db.query.postsTable.findMany({
      where: (post, { inArray }) => inArray(post.id, ids),
      with: { files: true },
    });

    return await Promise.all(
      posts.map(async (post) => ({
        ...post,
        files: await Promise.all(
          post.files.map(async (file) => ({
            ...file,
            publicUrl: await this.storage.getSignedUrl(
              file.bucket,
              file.filePath,
            ),
          })),
        ),
      })),
    );
  }

  async getPostsByCollection(collectionId: number) {
    const postIds = await db
      .select({ postId: postCollectionsTable.postId })
      .from(postCollectionsTable)
      .where(eq(postCollectionsTable.collectionId, collectionId));

    const ids = postIds.map((r) => r.postId);
    const posts = await db.query.postsTable.findMany({
      where: (post, { inArray }) => inArray(post.id, ids),
      with: { files: true },
    });

    return await Promise.all(
      posts.map(async (post) => ({
        ...post,
        files: await Promise.all(
          post.files.map(async (file) => ({
            ...file,
            publicUrl: await this.storage.getSignedUrl(
              file.bucket,
              file.filePath,
            ),
          })),
        ),
      })),
    );
  }

  async getPostsByCommunity(communityId: number) {
    const postIds = await db
      .select({ postId: postCommunitiesTable.postId })
      .from(postCommunitiesTable)
      .where(eq(postCommunitiesTable.communityId, communityId));

    const ids = postIds.map((r) => r.postId);
    const posts = await db.query.postsTable.findMany({
      where: (post, { inArray }) => inArray(post.id, ids),
      with: { files: true },
    });

    return await Promise.all(
      posts.map(async (post) => ({
        ...post,
        files: await Promise.all(
          post.files.map(async (file) => ({
            ...file,
            publicUrl: await this.storage.getSignedUrl(
              file.bucket,
              file.filePath,
            ),
          })),
        ),
      })),
    );
  }
  async getPaginatedPostsByCategory(
    categoryId: number,
    limit: number,
    offset: number,
  ) {
    const postIds = await db
      .select({ postId: postCategoriesTable.postId })
      .from(postCategoriesTable)
      .where(eq(postCategoriesTable.categoryId, categoryId));

    const ids = postIds.map((r) => r.postId);
    const posts = await db.query.postsTable.findMany({
      where: (post, { inArray }) => inArray(post.id, ids),
      with: {
        files: true,
        user: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
      limit,
      offset,
      orderBy: (posts, { desc }) => [desc(posts.createdAt)],
    });

    return Promise.all(
      posts.map(async (post) => ({
        ...post,
        files: await Promise.all(
          post.files.map(async (file) => ({
            ...file,
            publicUrl: await this.storage.getSignedUrl(
              file.bucket,
              file.filePath,
            ),
          })),
        ),
      })),
    );
  }

  async getPaginatedPostsByCollection(
    collectionId: number,
    limit: number,
    offset: number,
  ) {
    const postIds = await db
      .select({ postId: postCollectionsTable.postId })
      .from(postCollectionsTable)
      .where(eq(postCollectionsTable.collectionId, collectionId));

    const ids = postIds.map((r) => r.postId);
    const posts = await db.query.postsTable.findMany({
      where: (post, { inArray }) => inArray(post.id, ids),
      with: {
        files: true,
        user: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
      limit,
      offset,
      orderBy: (posts, { desc }) => [desc(posts.createdAt)],
    });

    return Promise.all(
      posts.map(async (post) => ({
        ...post,
        files: await Promise.all(
          post.files.map(async (file) => ({
            ...file,
            publicUrl: await this.storage.getSignedUrl(
              file.bucket,
              file.filePath,
            ),
          })),
        ),
      })),
    );
  }

  async getPaginatedPostsByCommunity(
    communityId: number,
    limit: number,
    offset: number,
  ) {
    const postIds = await db
      .select({ postId: postCommunitiesTable.postId })
      .from(postCommunitiesTable)
      .where(eq(postCommunitiesTable.communityId, communityId));

    const ids = postIds.map((r) => r.postId);
    const posts = await db.query.postsTable.findMany({
      where: (post, { inArray }) => inArray(post.id, ids),
      with: {
        files: true,
        user: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
      limit,
      offset,
      orderBy: (posts, { desc }) => [desc(posts.createdAt)],
    });

    return Promise.all(
      posts.map(async (post) => ({
        ...post,
        files: await Promise.all(
          post.files.map(async (file) => ({
            ...file,
            publicUrl: await this.storage.getSignedUrl(
              file.bucket,
              file.filePath,
            ),
          })),
        ),
      })),
    );
  }

  async assignToCategory(postId: number, categoryId: number) {
    return db
      .insert(postCategoriesTable)
      .values({ postId, categoryId })
      .returning();
  }

  async assignToCollection(postId: number, collectionId: number) {
    return db
      .insert(postCollectionsTable)
      .values({ postId, collectionId })
      .returning();
  }

  async assignToCommunity(postId: number, communityId: number) {
    return db
      .insert(postCommunitiesTable)
      .values({ postId, communityId })
      .returning();
  }
}
