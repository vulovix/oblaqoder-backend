import { Injectable } from '@nestjs/common';
import { db } from '../../configuration/db';
import {
  communitiesTable,
  InsertCommunity,
} from '../../configuration/db/schema';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { eq } from 'drizzle-orm';

@Injectable()
export class CommunitiesService {
  async create(dto: CreateCommunityDto) {
    const [community] = await db
      .insert(communitiesTable)
      .values(dto as InsertCommunity)
      .returning();

    return community;
  }

  async findAll() {
    return db.query.communitiesTable.findMany();
  }

  async findAllPublic() {
    return db.query.communitiesTable.findMany({
      where: eq(communitiesTable.isPublic, true),
    });
  }

  async findOne(id: number) {
    return db.query.communitiesTable.findFirst({
      where: eq(communitiesTable.id, id),
    });
  }

  async findOneWithUser(id: number) {
    return db.query.communitiesTable.findFirst({
      where: eq(communitiesTable.id, id),
      with: {
        user: true,
      },
    });
  }

  async findAllByUser(userId: number) {
    return db.query.communitiesTable.findMany({
      where: eq(communitiesTable.userId, userId),
    });
  }

  async update(id: number, dto: UpdateCommunityDto) {
    const [updated] = await db
      .update(communitiesTable)
      .set(dto)
      .where(eq(communitiesTable.id, id))
      .returning();

    return updated;
  }

  async delete(id: number) {
    return db.delete(communitiesTable).where(eq(communitiesTable.id, id));
  }
}
