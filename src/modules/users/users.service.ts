import { Injectable } from '@nestjs/common';
import { db } from '../../configuration/db';
import { InsertUser, usersTable } from '../../configuration/db/schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { eq } from 'drizzle-orm';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';

@Injectable()
export class UsersService {
  constructor(private readonly jwtService: JwtService) {}

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

  async findOneByEmail(email: string, res: Response) {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, email),
    });

    if (!user) throw new Error('User not found');

    const token = this.jwtService.sign({ sub: user.id, email: user.email });

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return user;
  }

  logout(res: Response) {
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return { ok: 200 };
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
