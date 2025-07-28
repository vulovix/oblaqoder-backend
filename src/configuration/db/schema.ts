// src/db/schema.ts
import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- USERS ---
export const usersTable = pgTable('users_table', {
  id: serial('id').primaryKey(),
  name: text('name').default('User'),
  email: text('email').notNull().unique(),
});

export const usersRelations = relations(usersTable, ({ many }) => ({
  posts: many(postsTable),
}));

// --- POSTS ---
export const postsTable = pgTable('posts_table', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  isPublic: boolean('is_public').notNull().default(true),
  userId: integer('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .$onUpdate(() => new Date()),
});

export const postsRelations = relations(postsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [postsTable.userId],
    references: [usersTable.id],
  }),
  files: many(postFilesTable),
  categories: many(postCategoriesTable),
  collections: many(postCollectionsTable),
  communities: many(postCommunitiesTable),
}));

// --- POST FILES ---
export const postFilesTable = pgTable('post_files_table', {
  id: serial('id').primaryKey(),
  postId: integer('post_id')
    .notNull()
    .references(() => postsTable.id, { onDelete: 'cascade' }),
  filePath: text('file_path').notNull(),
  bucket: text('bucket').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
});

export const postFilesRelations = relations(postFilesTable, ({ one }) => ({
  post: one(postsTable, {
    fields: [postFilesTable.postId],
    references: [postsTable.id],
  }),
}));

// --- COLLECTIONS ---
export const collectionsTable = pgTable('collections_table', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  isPublic: boolean('is_public').notNull().default(false),
  userId: integer('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
});

export const collectionsRelations = relations(collectionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [collectionsTable.userId],
    references: [usersTable.id],
  }),
}));

// --- COMMUNITIES ---
export const communitiesTable = pgTable('communities_table', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  isPublic: boolean('is_public').notNull().default(false),
  userId: integer('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
});

export const communitiesRelations = relations(communitiesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [communitiesTable.userId],
    references: [usersTable.id],
  }),
}));

// --- CATEGORIES ---
export const categoriesTable = pgTable('categories_table', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  isPublic: boolean('is_public').notNull().default(false),
  userId: integer('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
});

export const categoriesRelations = relations(categoriesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [categoriesTable.userId],
    references: [usersTable.id],
  }),
}));

// --- POST-COLLECTIONS ---
export const postCollectionsTable = pgTable('post_collections_table', {
  postId: integer('post_id')
    .notNull()
    .references(() => postsTable.id, { onDelete: 'cascade' }),
  collectionId: integer('collection_id')
    .notNull()
    .references(() => collectionsTable.id, { onDelete: 'cascade' }),
});

export const postCollectionsRelations = relations(
  postCollectionsTable,
  ({ one }) => ({
    post: one(postsTable, {
      fields: [postCollectionsTable.postId],
      references: [postsTable.id],
    }),
    collection: one(collectionsTable, {
      fields: [postCollectionsTable.collectionId],
      references: [collectionsTable.id],
    }),
  }),
);

// --- POST-COMMUNITIES ---
export const postCommunitiesTable = pgTable('post_communities_table', {
  postId: integer('post_id')
    .notNull()
    .references(() => postsTable.id, { onDelete: 'cascade' }),
  communityId: integer('community_id')
    .notNull()
    .references(() => communitiesTable.id, { onDelete: 'cascade' }),
});

export const postCommunitiesRelations = relations(
  postCommunitiesTable,
  ({ one }) => ({
    post: one(postsTable, {
      fields: [postCommunitiesTable.postId],
      references: [postsTable.id],
    }),
    community: one(communitiesTable, {
      fields: [postCommunitiesTable.communityId],
      references: [communitiesTable.id],
    }),
  }),
);

// --- POST-CATEGORIES ---
export const postCategoriesTable = pgTable('post_categories_table', {
  postId: integer('post_id')
    .notNull()
    .references(() => postsTable.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id')
    .notNull()
    .references(() => categoriesTable.id, { onDelete: 'cascade' }),
});

export const postCategoriesRelations = relations(
  postCategoriesTable,
  ({ one }) => ({
    post: one(postsTable, {
      fields: [postCategoriesTable.postId],
      references: [postsTable.id],
    }),
    category: one(categoriesTable, {
      fields: [postCategoriesTable.categoryId],
      references: [categoriesTable.id],
    }),
  }),
);

// --- TOPICS ---
export const topicsTable = pgTable('topics_table', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  isPublic: boolean('is_public').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .$onUpdate(() => new Date()),
});

export const topicsRelations = relations(topicsTable, ({ many }) => ({
  collections: many(topicCollectionsTable),
  categories: many(topicCategoriesTable),
  communities: many(topicCommunitiesTable),
}));

export const topicCollectionsTable = pgTable('topic_collections_table', {
  topicId: integer('topic_id')
    .notNull()
    .references(() => topicsTable.id, { onDelete: 'cascade' }),
  collectionId: integer('collection_id')
    .notNull()
    .references(() => collectionsTable.id, { onDelete: 'cascade' }),
});

export const topicCollectionsRelations = relations(
  topicCollectionsTable,
  ({ one }) => ({
    topic: one(topicsTable, {
      fields: [topicCollectionsTable.topicId],
      references: [topicsTable.id],
    }),
    collection: one(collectionsTable, {
      fields: [topicCollectionsTable.collectionId],
      references: [collectionsTable.id],
    }),
  }),
);

export const topicCategoriesTable = pgTable('topic_categories_table', {
  topicId: integer('topic_id')
    .notNull()
    .references(() => topicsTable.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id')
    .notNull()
    .references(() => categoriesTable.id, { onDelete: 'cascade' }),
});

export const topicCategoriesRelations = relations(
  topicCategoriesTable,
  ({ one }) => ({
    topic: one(topicsTable, {
      fields: [topicCategoriesTable.topicId],
      references: [topicsTable.id],
    }),
    category: one(categoriesTable, {
      fields: [topicCategoriesTable.categoryId],
      references: [categoriesTable.id],
    }),
  }),
);

export const topicCommunitiesTable = pgTable('topic_communities_table', {
  topicId: integer('topic_id')
    .notNull()
    .references(() => topicsTable.id, { onDelete: 'cascade' }),
  communityId: integer('community_id')
    .notNull()
    .references(() => communitiesTable.id, { onDelete: 'cascade' }),
});

export const topicCommunitiesRelations = relations(
  topicCommunitiesTable,
  ({ one }) => ({
    topic: one(topicsTable, {
      fields: [topicCommunitiesTable.topicId],
      references: [topicsTable.id],
    }),
    community: one(communitiesTable, {
      fields: [topicCommunitiesTable.communityId],
      references: [communitiesTable.id],
    }),
  }),
);

// --- TYPES ---
export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;

export type InsertPost = typeof postsTable.$inferInsert;
export type SelectPost = typeof postsTable.$inferSelect;

export type InsertPostFile = typeof postFilesTable.$inferInsert;
export type SelectPostFile = typeof postFilesTable.$inferSelect;

export type InsertCollection = typeof collectionsTable.$inferInsert;
export type SelectCollection = typeof collectionsTable.$inferSelect;

export type InsertCommunity = typeof communitiesTable.$inferInsert;
export type SelectCommunity = typeof communitiesTable.$inferSelect;

export type InsertCategory = typeof categoriesTable.$inferInsert;
export type SelectCategory = typeof categoriesTable.$inferSelect;

export type InsertPostCategory = typeof postCategoriesTable.$inferInsert;
export type InsertPostCollection = typeof postCollectionsTable.$inferInsert;
export type InsertPostCommunity = typeof postCommunitiesTable.$inferInsert;

export type InsertTopic = typeof topicsTable.$inferInsert;
export type SelectTopic = typeof topicsTable.$inferSelect;

export type InsertTopicCollection = typeof topicCollectionsTable.$inferInsert;
export type InsertTopicCategory = typeof topicCategoriesTable.$inferInsert;
export type InsertTopicCommunity = typeof topicCommunitiesTable.$inferInsert;
