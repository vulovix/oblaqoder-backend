import { Injectable } from '@nestjs/common';
import { db } from '../../configuration/db';
import { InsertUser, usersTable } from '../../configuration/db/schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { eq } from 'drizzle-orm';

@Injectable()
export class UsersService {
  async create(dto: CreateUserDto) {
    const [user] = await db
      .insert(usersTable)
      .values(dto as InsertUser)
      .returning();

    return user;
  }

  async findOne(id: number) {
    return db.query.usersTable.findFirst({
      where: eq(usersTable.id, id),
    });
  }

  async findOneByEmail(email: string) {
    return db.query.usersTable.findFirst({
      where: eq(usersTable.email, email),
    });
  }

  async update(id: number, dto: UpdateUserDto) {
    const [updated] = await db
      .update(usersTable)
      .set(dto)
      .where(eq(usersTable.id, id))
      .returning();

    return updated;
  }

  async delete(id: number) {
    return db.delete(usersTable).where(eq(usersTable.id, id));
  }
}
