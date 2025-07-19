import { Injectable } from '@nestjs/common';
import { db } from '../../configuration/db';
import {
  collectionsTable,
  InsertCollection,
} from '../../configuration/db/schema';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { eq } from 'drizzle-orm';

@Injectable()
export class CollectionsService {
  async create(dto: CreateCollectionDto) {
    const [collection] = await db
      .insert(collectionsTable)
      .values(dto as InsertCollection)
      .returning();

    return collection;
  }

  async findAll() {
    return db.query.collectionsTable.findMany();
  }

  async findAllPublic() {
    return db.query.collectionsTable.findMany({
      where: eq(collectionsTable.isPublic, true),
    });
  }

  async findOne(id: number) {
    return db.query.collectionsTable.findFirst({
      where: eq(collectionsTable.id, id),
    });
  }

  async findOneWithUser(id: number) {
    return db.query.collectionsTable.findFirst({
      where: eq(collectionsTable.id, id),
      with: {
        user: true,
      },
    });
  }

  async findAllByUser(userId: number) {
    return db.query.collectionsTable.findMany({
      where: eq(collectionsTable.userId, userId),
    });
  }

  async update(id: number, dto: UpdateCollectionDto) {
    const [updated] = await db
      .update(collectionsTable)
      .set(dto)
      .where(eq(collectionsTable.id, id))
      .returning();

    return updated;
  }

  async delete(id: number) {
    return db.delete(collectionsTable).where(eq(collectionsTable.id, id));
  }
}
