import { Injectable } from '@nestjs/common';
import { db } from '../../configuration/db';
import { categoriesTable, InsertCategory } from '../../configuration/db/schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { eq } from 'drizzle-orm';

@Injectable()
export class CategoriesService {
  async create(dto: CreateCategoryDto) {
    const [category] = await db
      .insert(categoriesTable)
      .values(dto as InsertCategory)
      .returning();

    return category;
  }

  async findAll() {
    return db.query.categoriesTable.findMany();
  }

  async findAllPublic() {
    return db.query.categoriesTable.findMany({
      where: eq(categoriesTable.isPublic, true),
    });
  }

  async findOne(id: number) {
    return db.query.categoriesTable.findFirst({
      where: eq(categoriesTable.id, id),
    });
  }

  async findOneWithUser(id: number) {
    return db.query.categoriesTable.findFirst({
      where: eq(categoriesTable.id, id),
      with: {
        user: true,
      },
    });
  }

  async findAllByUser(userId: number) {
    return db.query.categoriesTable.findMany({
      where: eq(categoriesTable.userId, userId),
    });
  }

  async update(id: number, dto: UpdateCategoryDto) {
    const [updated] = await db
      .update(categoriesTable)
      .set(dto)
      .where(eq(categoriesTable.id, id))
      .returning();

    return updated;
  }

  async delete(id: number) {
    return db.delete(categoriesTable).where(eq(categoriesTable.id, id));
  }
}
