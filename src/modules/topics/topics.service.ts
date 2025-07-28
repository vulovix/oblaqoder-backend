import { Injectable } from '@nestjs/common';
import { db } from '../../configuration/db';
import {
  topicsTable,
  topicCategoriesTable,
  topicCollectionsTable,
  topicCommunitiesTable,
  categoriesTable,
  collectionsTable,
  communitiesTable,
} from '../../configuration/db/schema';
import { eq } from 'drizzle-orm';
import { UpdateTopicDto } from './dto/update-topic.dto';

@Injectable()
export class TopicsService {
  async findAllPublic() {
    return db.select().from(topicsTable).where(eq(topicsTable.isPublic, true));
  }

  async findAll() {
    return db.select().from(topicsTable);
  }

  async createTopic(data: { name: string; slug: string }) {
    const [created] = await db.insert(topicsTable).values(data).returning();
    return created;
  }

  async getTopicWithRelations(id: number) {
    const [topic] = await db
      .select()
      .from(topicsTable)
      .where(eq(topicsTable.id, id));

    if (!topic) return null;

    const collections = await db
      .select({
        id: collectionsTable.id,
        name: collectionsTable.name,
        slug: collectionsTable.slug,
      })
      .from(topicCollectionsTable)
      .where(eq(topicCollectionsTable.topicId, id))
      .innerJoin(
        collectionsTable,
        eq(topicCollectionsTable.collectionId, collectionsTable.id),
      );

    const categories = await db
      .select({
        id: categoriesTable.id,
        name: categoriesTable.name,
        slug: categoriesTable.slug,
      })
      .from(topicCategoriesTable)
      .where(eq(topicCategoriesTable.topicId, id))
      .innerJoin(
        categoriesTable,
        eq(topicCategoriesTable.categoryId, categoriesTable.id),
      );

    const communities = await db
      .select({
        id: communitiesTable.id,
        name: communitiesTable.name,
        slug: communitiesTable.slug,
      })
      .from(topicCommunitiesTable)
      .where(eq(topicCommunitiesTable.topicId, id))
      .innerJoin(
        communitiesTable,
        eq(topicCommunitiesTable.communityId, communitiesTable.id),
      );

    return {
      ...topic,
      collections,
      categories,
      communities,
    };
  }

  async update(id: number, dto: UpdateTopicDto) {
    const [updated] = await db
      .update(topicsTable)
      .set(dto)
      .where(eq(topicsTable.id, id))
      .returning();

    return updated;
  }

  async updateTopicRelations(
    topicId: number,
    links: { type: string; id: number }[],
  ) {
    // Clear all existing links
    await Promise.all([
      db
        .delete(topicCollectionsTable)
        .where(eq(topicCollectionsTable.topicId, topicId)),
      db
        .delete(topicCategoriesTable)
        .where(eq(topicCategoriesTable.topicId, topicId)),
      db
        .delete(topicCommunitiesTable)
        .where(eq(topicCommunitiesTable.topicId, topicId)),
    ]);

    // Separate by type
    const collections = links.filter((l) => l.type === 'collection');
    const categories = links.filter((l) => l.type === 'category');
    const communities = links.filter((l) => l.type === 'community');

    // Insert new links
    if (collections.length > 0) {
      await db.insert(topicCollectionsTable).values(
        collections.map((l) => ({
          topicId,
          collectionId: l.id,
        })),
      );
    }

    if (categories.length > 0) {
      await db.insert(topicCategoriesTable).values(
        categories.map((l) => ({
          topicId,
          categoryId: l.id,
        })),
      );
    }

    if (communities.length > 0) {
      await db.insert(topicCommunitiesTable).values(
        communities.map((l) => ({
          topicId,
          communityId: l.id,
        })),
      );
    }

    return this.getTopicWithRelations(topicId);
  }

  async delete(id: number) {
    return db.delete(topicsTable).where(eq(topicsTable.id, id));
  }
}
