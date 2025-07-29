// src/posts/posts.service.ts
import { Injectable } from '@nestjs/common';
import { db } from '../../configuration/db';
import {
  categoriesTable,
  collectionsTable,
  communitiesTable,
  InsertPostCategory,
  InsertPostCollection,
  InsertPostCommunity,
  postsTable,
  topicCategoriesTable,
  topicCollectionsTable,
  topicCommunitiesTable,
} from '../../configuration/db/schema';
import { CreatePostDto } from './dto/create-post.dto';
import { and, desc, eq, exists, gte, inArray, lt, not } from 'drizzle-orm';
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

  // async getPaginatedPostsByDateOld(
  //   limit: number,
  //   offset: number,
  //   date?: string,
  //   includeHiddenSources: boolean = false,
  // ) {
  //   const posts = await db.query.postsTable.findMany({
  //     with: {
  //       files: true,
  //       user: {
  //         columns: {
  //           id: true,
  //           name: true,
  //         },
  //       },
  //       categories: {
  //         columns: {},
  //         with: {
  //           category: true,
  //         },
  //       },
  //       collections: {
  //         columns: {},
  //         with: {
  //           collection: true,
  //         },
  //       },
  //       communities: {
  //         columns: {},
  //         with: {
  //           community: true,
  //         },
  //       },
  //     },
  //     where: date
  //       ? (post, { and, gte, lt }) =>
  //           and(
  //             gte(post.createdAt, new Date(`${date}T00:00:00.000Z`)),
  //             lt(post.createdAt, new Date(`${date}T23:59:59.999Z`)),
  //           )
  //       : undefined,
  //     limit,
  //     offset,
  //     orderBy: (posts, { desc }) => [desc(posts.createdAt)],
  //   });

  //   const filtered = includeHiddenSources
  //     ? posts
  //     : posts.filter((post) => {
  //         if (post.isPublic === false) return false;

  //         const hasHiddenCategory = post.categories?.some(
  //           (c) => c.category?.isPublic === false,
  //         );
  //         const hasHiddenCollection = post.collections?.some(
  //           (c) => c.collection?.isPublic === false,
  //         );
  //         const hasHiddenCommunity = post.communities?.some(
  //           (c) => c.community?.isPublic === false,
  //         );

  //         const hasHiddenRelation =
  //           hasHiddenCategory || hasHiddenCollection || hasHiddenCommunity;

  //         return !hasHiddenRelation;
  //       });
  //   return Promise.all(
  //     filtered.map(async (post) => ({
  //       ...post,
  //       files: await Promise.all(
  //         post.files.map(async (file) => ({
  //           ...file,
  //           publicUrl: await this.storage.getSignedUrl(
  //             file.bucket,
  //             file.filePath,
  //           ),
  //         })),
  //       ),
  //       categories: post.categories.map((pc) => pc.category),
  //       collections: post.collections.map((pc) => pc.collection),
  //       communities: post.communities.map((pc) => pc.community),
  //     })),
  //   );
  // }

  async getPaginatedPostsByDate(
    limit: number,
    offset: number,
    date?: string,
    includeHiddenSources: boolean = false,
  ) {
    // Step 1: Get only the IDs of visible posts (filtered + paginated in DB)
    const baseConditions: any[] = [];

    if (date) {
      baseConditions.push(
        gte(postsTable.createdAt, new Date(`${date}T00:00:00.000Z`)),
        lt(postsTable.createdAt, new Date(`${date}T23:59:59.999Z`)),
      );
    }

    if (!includeHiddenSources) {
      baseConditions.push(eq(postsTable.isPublic, true));

      baseConditions.push(
        not(
          exists(
            db
              .select()
              .from(postCategoriesTable)
              .innerJoin(
                categoriesTable,
                eq(postCategoriesTable.categoryId, categoriesTable.id),
              )
              .where(
                and(
                  eq(postCategoriesTable.postId, postsTable.id),
                  eq(categoriesTable.isPublic, false),
                ),
              ),
          ),
        ),
        not(
          exists(
            db
              .select()
              .from(postCollectionsTable)
              .innerJoin(
                collectionsTable,
                eq(postCollectionsTable.collectionId, collectionsTable.id),
              )
              .where(
                and(
                  eq(postCollectionsTable.postId, postsTable.id),
                  eq(collectionsTable.isPublic, false),
                ),
              ),
          ),
        ),
        not(
          exists(
            db
              .select()
              .from(postCommunitiesTable)
              .innerJoin(
                communitiesTable,
                eq(postCommunitiesTable.communityId, communitiesTable.id),
              )
              .where(
                and(
                  eq(postCommunitiesTable.postId, postsTable.id),
                  eq(communitiesTable.isPublic, false),
                ),
              ),
          ),
        ),
      );
    }

    const postIdsResult = await db
      .select({ id: postsTable.id })
      .from(postsTable)
      .where(and(...baseConditions))
      .orderBy(desc(postsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const postIds = postIdsResult.map((row) => row.id);

    if (postIds.length === 0) return [];

    // Step 2: Load the full posts with relations
    const posts = await db.query.postsTable.findMany({
      where: (post, { inArray }) => inArray(post.id, postIds),
      with: {
        files: true,
        user: {
          columns: {
            id: true,
            name: true,
          },
        },
        categories: {
          with: { category: true },
        },
        collections: {
          with: { collection: true },
        },
        communities: {
          with: { community: true },
        },
      },
      orderBy: (post, { desc }) => [desc(post.createdAt)],
    });

    // Step 3: Map signed URLs and flatten nested relations
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
        categories: post.categories.map((c) => c.category),
        collections: post.collections.map((c) => c.collection),
        communities: post.communities.map((c) => c.community),
      })),
    );
  }

  async getPaginatedPostsByDateOld(
    limit: number,
    offset: number,
    date?: string,
    includeHiddenSources: boolean = false,
  ) {
    // Step 1: Fetch ALL posts for the date (not limited yet)
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
      orderBy: (posts, { desc }) => [desc(posts.createdAt)],
    });

    // Step 2: Filter hidden posts if needed
    const visible = includeHiddenSources
      ? posts
      : posts.filter((post) => {
          if (post.isPublic === false) return false;

          const hasHiddenCategory = post.categories.some(
            (c) => c.category?.isPublic === false,
          );
          const hasHiddenCollection = post.collections.some(
            (c) => c.collection?.isPublic === false,
          );
          const hasHiddenCommunity = post.communities.some(
            (c) => c.community?.isPublic === false,
          );

          return (
            !hasHiddenCategory && !hasHiddenCollection && !hasHiddenCommunity
          );
        });

    // Step 3: Apply pagination AFTER filtering
    const paginated = visible.slice(offset, offset + limit);

    // Step 4: Add signed file URLs
    return Promise.all(
      paginated.map(async (post) => ({
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
    await db
      .update(postsTable)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(postsTable.id, id))
      .returning();

    const post = await db.query.postsTable.findFirst({
      with: {
        files: true,
        user: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
      where: eq(postsTable.id, id),
    });

    const postWithFiles = {
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
    };

    return postWithFiles;
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

  async getPaginatedPostsByTopicOld(
    topicId: number,
    limit: number,
    offset: number,
    includeHiddenSources = false,
  ) {
    // Korak 1: Skupi sve postId-eve preko svih relacija
    const categoryPostIds = await db
      .select({ postId: postCategoriesTable.postId })
      .from(postCategoriesTable)
      .innerJoin(
        topicCategoriesTable,
        and(
          eq(topicCategoriesTable.categoryId, postCategoriesTable.categoryId),
          eq(topicCategoriesTable.topicId, topicId),
        ),
      );

    const collectionPostIds = await db
      .select({ postId: postCollectionsTable.postId })
      .from(postCollectionsTable)
      .innerJoin(
        topicCollectionsTable,
        and(
          eq(
            topicCollectionsTable.collectionId,
            postCollectionsTable.collectionId,
          ),
          eq(topicCollectionsTable.topicId, topicId),
        ),
      );

    const communityPostIds = await db
      .select({ postId: postCommunitiesTable.postId })
      .from(postCommunitiesTable)
      .innerJoin(
        topicCommunitiesTable,
        and(
          eq(
            topicCommunitiesTable.communityId,
            postCommunitiesTable.communityId,
          ),
          eq(topicCommunitiesTable.topicId, topicId),
        ),
      );

    const allPostIds = [
      ...categoryPostIds,
      ...collectionPostIds,
      ...communityPostIds,
    ].map((r) => r.postId);

    const uniqueIds = [...new Set(allPostIds)];
    if (uniqueIds.length === 0) return [];

    // Korak 2: Pokupi sve postove koji odgovaraju
    const posts = await db.query.postsTable.findMany({
      where: (post, { inArray }) => inArray(post.id, uniqueIds),
      with: {
        files: true,
        user: {
          columns: {
            id: true,
            name: true,
          },
        },
        categories: { with: { category: true } },
        collections: { with: { collection: true } },
        communities: { with: { community: true } },
      },
      orderBy: (post, { desc }) => [desc(post.createdAt)],
    });

    // Korak 3: Filtriraj po vidljivosti
    const filtered = includeHiddenSources
      ? posts
      : posts.filter((post) => {
          if (!post.isPublic) return false;
          const hasHiddenCategory = post.categories.some(
            (c) => c.category?.isPublic === false,
          );
          const hasHiddenCollection = post.collections.some(
            (c) => c.collection?.isPublic === false,
          );
          const hasHiddenCommunity = post.communities.some(
            (c) => c.community?.isPublic === false,
          );
          return (
            !hasHiddenCategory && !hasHiddenCollection && !hasHiddenCommunity
          );
        });

    // Korak 4: Paginacija
    const paginated = filtered.slice(offset, offset + limit);

    // Korak 5: Potpisani URL-ovi
    return Promise.all(
      paginated.map(async (post) => ({
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

  async getPaginatedPostsByTopic(
    topicId: number,
    limit: number,
    offset: number,
    includeHiddenSources = false,
  ) {
    // Korak 1: Pronađi sve postId-eve vezane za topic
    const categoryPostIds = await db
      .select({ postId: postCategoriesTable.postId })
      .from(postCategoriesTable)
      .innerJoin(
        topicCategoriesTable,
        and(
          eq(topicCategoriesTable.categoryId, postCategoriesTable.categoryId),
          eq(topicCategoriesTable.topicId, topicId),
        ),
      );

    const collectionPostIds = await db
      .select({ postId: postCollectionsTable.postId })
      .from(postCollectionsTable)
      .innerJoin(
        topicCollectionsTable,
        and(
          eq(
            topicCollectionsTable.collectionId,
            postCollectionsTable.collectionId,
          ),
          eq(topicCollectionsTable.topicId, topicId),
        ),
      );

    const communityPostIds = await db
      .select({ postId: postCommunitiesTable.postId })
      .from(postCommunitiesTable)
      .innerJoin(
        topicCommunitiesTable,
        and(
          eq(
            topicCommunitiesTable.communityId,
            postCommunitiesTable.communityId,
          ),
          eq(topicCommunitiesTable.topicId, topicId),
        ),
      );

    // Korak 2: Spoji i očisti ID-jeve
    const allPostIds = [
      ...categoryPostIds,
      ...collectionPostIds,
      ...communityPostIds,
    ].map((r) => r.postId);

    const uniqueIds = [...new Set(allPostIds)];
    if (uniqueIds.length === 0) return [];

    // Korak 3: SQL filtrirani upit sa LIMIT i OFFSET
    const visibilityFilters = !includeHiddenSources
      ? [
          eq(postsTable.isPublic, true),
          not(
            exists(
              db
                .select()
                .from(postCategoriesTable)
                .innerJoin(
                  categoriesTable,
                  eq(postCategoriesTable.categoryId, categoriesTable.id),
                )
                .where(
                  and(
                    eq(postCategoriesTable.postId, postsTable.id),
                    eq(categoriesTable.isPublic, false),
                  ),
                ),
            ),
          ),
          not(
            exists(
              db
                .select()
                .from(postCollectionsTable)
                .innerJoin(
                  collectionsTable,
                  eq(postCollectionsTable.collectionId, collectionsTable.id),
                )
                .where(
                  and(
                    eq(postCollectionsTable.postId, postsTable.id),
                    eq(collectionsTable.isPublic, false),
                  ),
                ),
            ),
          ),
          not(
            exists(
              db
                .select()
                .from(postCommunitiesTable)
                .innerJoin(
                  communitiesTable,
                  eq(postCommunitiesTable.communityId, communitiesTable.id),
                )
                .where(
                  and(
                    eq(postCommunitiesTable.postId, postsTable.id),
                    eq(communitiesTable.isPublic, false),
                  ),
                ),
            ),
          ),
        ]
      : [];

    const paginatedPostIds = await db
      .select({ id: postsTable.id })
      .from(postsTable)
      .where(and(inArray(postsTable.id, uniqueIds), ...visibilityFilters))
      .orderBy(desc(postsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const ids = paginatedPostIds.map((r) => r.id);
    if (ids.length === 0) return [];

    // Korak 4: Povučeš sve postove za te ID-jeve
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
        categories: { with: { category: true } },
        collections: { with: { collection: true } },
        communities: { with: { community: true } },
      },
      orderBy: (post, { desc }) => [desc(post.createdAt)],
    });

    // Korak 5: Dodaj signed URL-ove
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
        categories: post.categories.map((pc) => pc.category),
        collections: post.collections.map((pc) => pc.collection),
        communities: post.communities.map((pc) => pc.community),
      })),
    );
  }

  // async getPaginatedPostsByCategoryOld(
  //   categoryId: number,
  //   limit: number,
  //   offset: number,
  //   includeHiddenSources: boolean = false,
  // ) {
  //   // Step 1: Get post IDs for this category
  //   const postIds = await db
  //     .select({ postId: postCategoriesTable.postId })
  //     .from(postCategoriesTable)
  //     .where(eq(postCategoriesTable.categoryId, categoryId));

  //   const ids = postIds.map((r) => r.postId);

  //   if (ids.length === 0) return [];

  //   // Step 2: Fetch all posts by those IDs (overfetch instead of limit)
  //   const posts = await db.query.postsTable.findMany({
  //     where: (post, { inArray }) => inArray(post.id, ids),
  //     with: {
  //       files: true,
  //       user: {
  //         columns: {
  //           id: true,
  //           name: true,
  //         },
  //       },
  //       categories: {
  //         with: { category: true },
  //       },
  //       collections: {
  //         with: { collection: true },
  //       },
  //       communities: {
  //         with: { community: true },
  //       },
  //     },
  //     orderBy: (posts, { desc }) => [desc(posts.createdAt)],
  //   });

  //   // Step 3: Filter visibility
  //   const filtered = includeHiddenSources
  //     ? posts
  //     : posts.filter((post) => {
  //         if (post.isPublic === false) return false;

  //         const hasHiddenCategory = post.categories.some(
  //           (c) => c.category?.isPublic === false,
  //         );
  //         const hasHiddenCollection = post.collections.some(
  //           (c) => c.collection?.isPublic === false,
  //         );
  //         const hasHiddenCommunity = post.communities.some(
  //           (c) => c.community?.isPublic === false,
  //         );

  //         return (
  //           !hasHiddenCategory && !hasHiddenCollection && !hasHiddenCommunity
  //         );
  //       });

  //   // Step 4: Slice after filtering for pagination
  //   const paginated = filtered.slice(offset, offset + limit);

  //   // Step 5: Transform post structure
  //   return Promise.all(
  //     paginated.map(async (post) => ({
  //       ...post,
  //       files: await Promise.all(
  //         post.files.map(async (file) => ({
  //           ...file,
  //           publicUrl: await this.storage.getSignedUrl(
  //             file.bucket,
  //             file.filePath,
  //           ),
  //         })),
  //       ),
  //       categories: post.categories.map((pc) => pc.category),
  //       collections: post.collections.map((pc) => pc.collection),
  //       communities: post.communities.map((pc) => pc.community),
  //     })),
  //   );
  // }

  async getPaginatedPostsByCategory(
    categoryId: number,
    limit: number,
    offset: number,
    includeHiddenSources: boolean = false,
  ) {
    const baseConditions: any[] = [
      eq(postCategoriesTable.categoryId, categoryId),
    ];

    if (!includeHiddenSources) {
      baseConditions.push(
        eq(postsTable.isPublic, true),
        not(
          exists(
            db
              .select()
              .from(postCategoriesTable)
              .innerJoin(
                categoriesTable,
                eq(postCategoriesTable.categoryId, categoriesTable.id),
              )
              .where(
                and(
                  eq(postCategoriesTable.postId, postsTable.id),
                  eq(categoriesTable.isPublic, false),
                ),
              ),
          ),
        ),
        not(
          exists(
            db
              .select()
              .from(postCollectionsTable)
              .innerJoin(
                collectionsTable,
                eq(postCollectionsTable.collectionId, collectionsTable.id),
              )
              .where(
                and(
                  eq(postCollectionsTable.postId, postsTable.id),
                  eq(collectionsTable.isPublic, false),
                ),
              ),
          ),
        ),
        not(
          exists(
            db
              .select()
              .from(postCommunitiesTable)
              .innerJoin(
                communitiesTable,
                eq(postCommunitiesTable.communityId, communitiesTable.id),
              )
              .where(
                and(
                  eq(postCommunitiesTable.postId, postsTable.id),
                  eq(communitiesTable.isPublic, false),
                ),
              ),
          ),
        ),
      );
    }

    // Step 1: Find post IDs related to the category and apply visibility filter
    const postIdsResult = await db
      .select({ id: postCategoriesTable.postId })
      .from(postCategoriesTable)
      .innerJoin(postsTable, eq(postCategoriesTable.postId, postsTable.id))
      .where(and(...baseConditions))
      .orderBy(desc(postsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const ids = postIdsResult.map((r) => r.id);
    if (ids.length === 0) return [];

    // Step 2: Fetch full posts
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
        categories: {
          with: { category: true },
        },
        collections: {
          with: { collection: true },
        },
        communities: {
          with: { community: true },
        },
      },
      orderBy: (post, { desc }) => [desc(post.createdAt)],
    });

    // Step 3: Signed file URLs and flatten
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
        categories: post.categories.map((pc) => pc.category),
        collections: post.collections.map((pc) => pc.collection),
        communities: post.communities.map((pc) => pc.community),
      })),
    );
  }

  // async getPaginatedPostsByCollectionOld(
  //   collectionId: number,
  //   limit: number,
  //   offset: number,
  //   includeHiddenSources: boolean = false,
  // ) {
  //   // Step 1: Get post IDs for this collection
  //   const postIds = await db
  //     .select({ postId: postCollectionsTable.postId })
  //     .from(postCollectionsTable)
  //     .where(eq(postCollectionsTable.collectionId, collectionId));

  //   const ids = postIds.map((r) => r.postId);

  //   if (ids.length === 0) return [];

  //   // Step 2: Fetch full post data without limit (we paginate after filtering)
  //   const posts = await db.query.postsTable.findMany({
  //     where: (post, { inArray }) => inArray(post.id, ids),
  //     with: {
  //       files: true,
  //       user: {
  //         columns: {
  //           id: true,
  //           name: true,
  //         },
  //       },
  //       categories: {
  //         with: { category: true },
  //       },
  //       collections: {
  //         with: { collection: true },
  //       },
  //       communities: {
  //         with: { community: true },
  //       },
  //     },
  //     orderBy: (posts, { desc }) => [desc(posts.createdAt)],
  //   });

  //   // Step 3: Filter hidden sources if necessary
  //   const filtered = includeHiddenSources
  //     ? posts
  //     : posts.filter((post) => {
  //         if (post.isPublic === false) return false;

  //         const hasHiddenCategory = post.categories.some(
  //           (c) => c.category?.isPublic === false,
  //         );
  //         const hasHiddenCollection = post.collections.some(
  //           (c) => c.collection?.isPublic === false,
  //         );
  //         const hasHiddenCommunity = post.communities.some(
  //           (c) => c.community?.isPublic === false,
  //         );

  //         return (
  //           !hasHiddenCategory && !hasHiddenCollection && !hasHiddenCommunity
  //         );
  //       });

  //   // Step 4: Apply offset and limit after filtering
  //   const paginated = filtered.slice(offset, offset + limit);

  //   // Step 5: Map + sign files
  //   return Promise.all(
  //     paginated.map(async (post) => ({
  //       ...post,
  //       files: await Promise.all(
  //         post.files.map(async (file) => ({
  //           ...file,
  //           publicUrl: await this.storage.getSignedUrl(
  //             file.bucket,
  //             file.filePath,
  //           ),
  //         })),
  //       ),
  //       categories: post.categories.map((pc) => pc.category),
  //       collections: post.collections.map((pc) => pc.collection),
  //       communities: post.communities.map((pc) => pc.community),
  //     })),
  //   );
  // }

  async getPaginatedPostsByCollection(
    collectionId: number,
    limit: number,
    offset: number,
    includeHiddenSources: boolean = false,
  ) {
    const baseConditions: any[] = [
      eq(postCollectionsTable.collectionId, collectionId),
    ];

    if (!includeHiddenSources) {
      baseConditions.push(
        eq(postsTable.isPublic, true),
        not(
          exists(
            db
              .select()
              .from(postCategoriesTable)
              .innerJoin(
                categoriesTable,
                eq(postCategoriesTable.categoryId, categoriesTable.id),
              )
              .where(
                and(
                  eq(postCategoriesTable.postId, postsTable.id),
                  eq(categoriesTable.isPublic, false),
                ),
              ),
          ),
        ),
        not(
          exists(
            db
              .select()
              .from(postCollectionsTable)
              .innerJoin(
                collectionsTable,
                eq(postCollectionsTable.collectionId, collectionsTable.id),
              )
              .where(
                and(
                  eq(postCollectionsTable.postId, postsTable.id),
                  eq(collectionsTable.isPublic, false),
                ),
              ),
          ),
        ),
        not(
          exists(
            db
              .select()
              .from(postCommunitiesTable)
              .innerJoin(
                communitiesTable,
                eq(postCommunitiesTable.communityId, communitiesTable.id),
              )
              .where(
                and(
                  eq(postCommunitiesTable.postId, postsTable.id),
                  eq(communitiesTable.isPublic, false),
                ),
              ),
          ),
        ),
      );
    }

    // Step 1: Get matching post IDs (filtered in SQL)
    const postIdsResult = await db
      .select({ id: postCollectionsTable.postId })
      .from(postCollectionsTable)
      .innerJoin(postsTable, eq(postCollectionsTable.postId, postsTable.id))
      .where(and(...baseConditions))
      .orderBy(desc(postsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const ids = postIdsResult.map((r) => r.id);
    if (ids.length === 0) return [];

    // Step 2: Fetch full post data for selected IDs
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
        categories: {
          with: { category: true },
        },
        collections: {
          with: { collection: true },
        },
        communities: {
          with: { community: true },
        },
      },
      orderBy: (post, { desc }) => [desc(post.createdAt)],
    });

    // Step 3: Map signed URLs + flatten relations
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
        categories: post.categories.map((pc) => pc.category),
        collections: post.collections.map((pc) => pc.collection),
        communities: post.communities.map((pc) => pc.community),
      })),
    );
  }

  // async getPaginatedPostsByCommunityOld(
  //   communityId: number,
  //   limit: number,
  //   offset: number,
  //   includeHiddenSources: boolean = false,
  // ) {
  //   // Step 1: Get all post IDs related to the community
  //   const postIds = await db
  //     .select({ postId: postCommunitiesTable.postId })
  //     .from(postCommunitiesTable)
  //     .where(eq(postCommunitiesTable.communityId, communityId));

  //   const ids = postIds.map((r) => r.postId);
  //   if (ids.length === 0) return [];

  //   // Step 2: Fetch all related posts (no pagination yet)
  //   const posts = await db.query.postsTable.findMany({
  //     where: (post, { inArray }) => inArray(post.id, ids),
  //     with: {
  //       files: true,
  //       user: {
  //         columns: {
  //           id: true,
  //           name: true,
  //         },
  //       },
  //       categories: {
  //         with: { category: true },
  //       },
  //       collections: {
  //         with: { collection: true },
  //       },
  //       communities: {
  //         with: { community: true },
  //       },
  //     },
  //     orderBy: (posts, { desc }) => [desc(posts.createdAt)],
  //   });

  //   // Step 3: Apply visibility filter
  //   const filtered = includeHiddenSources
  //     ? posts
  //     : posts.filter((post) => {
  //         if (!post.isPublic) return false;

  //         const hasHiddenCategory = post.categories.some(
  //           (c) => c.category?.isPublic === false,
  //         );
  //         const hasHiddenCollection = post.collections.some(
  //           (c) => c.collection?.isPublic === false,
  //         );
  //         const hasHiddenCommunity = post.communities.some(
  //           (c) => c.community?.isPublic === false,
  //         );

  //         return (
  //           !hasHiddenCategory && !hasHiddenCollection && !hasHiddenCommunity
  //         );
  //       });

  //   // Step 4: Slice after filtering for pagination
  //   const paginated = filtered.slice(offset, offset + limit);

  //   // Step 5: Return mapped result with signed file URLs
  //   return Promise.all(
  //     paginated.map(async (post) => ({
  //       ...post,
  //       files: await Promise.all(
  //         post.files.map(async (file) => ({
  //           ...file,
  //           publicUrl: await this.storage.getSignedUrl(
  //             file.bucket,
  //             file.filePath,
  //           ),
  //         })),
  //       ),
  //       categories: post.categories.map((pc) => pc.category),
  //       collections: post.collections.map((pc) => pc.collection),
  //       communities: post.communities.map((pc) => pc.community),
  //     })),
  //   );
  // }

  async getPaginatedPostsByCommunity(
    communityId: number,
    limit: number,
    offset: number,
    includeHiddenSources: boolean = false,
  ) {
    const baseConditions: any[] = [
      eq(postCommunitiesTable.communityId, communityId),
    ];

    if (!includeHiddenSources) {
      baseConditions.push(
        eq(postsTable.isPublic, true),
        not(
          exists(
            db
              .select()
              .from(postCategoriesTable)
              .innerJoin(
                categoriesTable,
                eq(postCategoriesTable.categoryId, categoriesTable.id),
              )
              .where(
                and(
                  eq(postCategoriesTable.postId, postsTable.id),
                  eq(categoriesTable.isPublic, false),
                ),
              ),
          ),
        ),
        not(
          exists(
            db
              .select()
              .from(postCollectionsTable)
              .innerJoin(
                collectionsTable,
                eq(postCollectionsTable.collectionId, collectionsTable.id),
              )
              .where(
                and(
                  eq(postCollectionsTable.postId, postsTable.id),
                  eq(collectionsTable.isPublic, false),
                ),
              ),
          ),
        ),
        not(
          exists(
            db
              .select()
              .from(postCommunitiesTable)
              .innerJoin(
                communitiesTable,
                eq(postCommunitiesTable.communityId, communitiesTable.id),
              )
              .where(
                and(
                  eq(postCommunitiesTable.postId, postsTable.id),
                  eq(communitiesTable.isPublic, false),
                ),
              ),
          ),
        ),
      );
    }

    // Step 1: Get post IDs with visibility + pagination applied
    const postIdsResult = await db
      .select({ id: postCommunitiesTable.postId })
      .from(postCommunitiesTable)
      .innerJoin(postsTable, eq(postCommunitiesTable.postId, postsTable.id))
      .where(and(...baseConditions))
      .orderBy(desc(postsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const ids = postIdsResult.map((r) => r.id);
    if (ids.length === 0) return [];

    // Step 2: Load full post records for the selected IDs
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
        categories: {
          with: { category: true },
        },
        collections: {
          with: { collection: true },
        },
        communities: {
          with: { community: true },
        },
      },
      orderBy: (post, { desc }) => [desc(post.createdAt)],
    });

    // Step 3: Attach signed URLs and flatten relations
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
        categories: post.categories.map((pc) => pc.category),
        collections: post.collections.map((pc) => pc.collection),
        communities: post.communities.map((pc) => pc.community),
      })),
    );
  }

  async assignToCategory(
    postId: number,
    categoryId: number,
  ): Promise<InsertPostCategory[]> {
    return db
      .insert(postCategoriesTable)
      .values({ postId, categoryId })
      .returning();
  }

  async assignToCollection(
    postId: number,
    collectionId: number,
  ): Promise<InsertPostCollection[]> {
    return db
      .insert(postCollectionsTable)
      .values({ postId, collectionId })
      .returning();
  }

  async assignToCommunity(
    postId: number,
    communityId: number,
  ): Promise<InsertPostCommunity[]> {
    return db
      .insert(postCommunitiesTable)
      .values({ postId, communityId })
      .returning();
  }

  async removePostCategoryRelation(postId: number) {
    await db
      .delete(postCategoriesTable)
      .where(eq(postCategoriesTable.postId, postId));
  }

  async removePostCollectionRelation(postId: number) {
    await db
      .delete(postCollectionsTable)
      .where(eq(postCollectionsTable.postId, postId));
  }

  async removePostCommunityRelation(postId: number) {
    await db
      .delete(postCommunitiesTable)
      .where(eq(postCommunitiesTable.postId, postId));
  }
}
