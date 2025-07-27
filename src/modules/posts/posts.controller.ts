// src/posts/posts.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import {
  JwtCookieAuthGuard,
  RequestWithCookies,
} from 'src/guards/JwtCookieAuthGuard';
import { JwtService } from '@nestjs/jwt';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('calendar')
  async getPosts(
    @Req() req: RequestWithCookies,
    @Query('includeHiddenSources') includeHiddenSources?: string,
  ) {
    let showHiddenSources = includeHiddenSources === 'true';
    if (showHiddenSources) {
      const token = req.cookies?.auth_token;
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const user = token ? await this.jwtService.verifyAsync(token) : null;
        if (!user) {
          showHiddenSources = false; // fallback to false silently
        }
      } catch {
        showHiddenSources = false; // invalid token → fallback silently
      }
    }
    return this.postsService.getCalendarPosts(showHiddenSources);
  }

  @Get('wall/paginated')
  async getPaginatedPostsByDate(
    @Req() req: RequestWithCookies,
    @Query('limit') limit: number,
    @Query('offset') offset: number,
    @Query('date') date?: string, // Optional, e.g. "2025-09-08"
    @Query('includeHiddenSources') includeHiddenSources?: string,
  ) {
    let showHiddenSources = includeHiddenSources === 'true';

    if (showHiddenSources) {
      const token = req.cookies?.auth_token;
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const user = token ? await this.jwtService.verifyAsync(token) : null;
        if (!user) {
          showHiddenSources = false; // fallback to false silently
        }
      } catch {
        showHiddenSources = false; // invalid token → fallback silently
      }
    }

    return this.postsService.getPaginatedPostsByDate(
      +limit,
      +offset,
      date,
      showHiddenSources,
    );
  }

  @Get('filtered/paginated')
  async getPaginatedPostsByRelation(
    @Req() req: RequestWithCookies,
    @Query('categoryId') categoryId?: number,
    @Query('collectionId') collectionId?: number,
    @Query('communityId') communityId?: number,
    @Query('limit') limit = 10,
    @Query('offset') offset = 0,
    @Query('includeHiddenSources') includeHiddenSources?: string,
  ) {
    let showHiddenSources = includeHiddenSources === 'true';
    if (showHiddenSources) {
      const token = req.cookies?.auth_token;
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const user = token ? await this.jwtService.verifyAsync(token) : null;
        if (!user) {
          showHiddenSources = false; // fallback to false silently
        }
      } catch {
        showHiddenSources = false; // invalid token → fallback silently
      }
    }
    if (categoryId)
      return this.postsService.getPaginatedPostsByCategory(
        +categoryId,
        +limit,
        +offset,
        showHiddenSources,
      );
    if (collectionId)
      return this.postsService.getPaginatedPostsByCollection(
        +collectionId,
        +limit,
        +offset,
        showHiddenSources,
      );
    if (communityId)
      return this.postsService.getPaginatedPostsByCommunity(
        +communityId,
        +limit,
        +offset,
        showHiddenSources,
      );
    return [];
  }

  @UseGuards(JwtCookieAuthGuard)
  @Post()
  async createPost(@Body() dto: CreatePostDto) {
    return this.postsService.createPost(dto);
  }

  @UseGuards(JwtCookieAuthGuard)
  @Delete(':id')
  async deletePost(@Param('id') id: string) {
    return this.postsService.deletePost(+id);
  }

  @UseGuards(JwtCookieAuthGuard)
  @Put(':id')
  async updatePost(
    @Param('id') id: string,
    @Body() dto: Partial<CreatePostDto>,
  ) {
    return this.postsService.updatePost(+id, dto);
  }

  @UseGuards(JwtCookieAuthGuard)
  @Post(':postId/categories/:categoryId')
  assignCategory(
    @Param('postId') postId: string,
    @Param('categoryId') categoryId: string,
  ) {
    return this.postsService.assignToCategory(+postId, +categoryId);
  }

  @UseGuards(JwtCookieAuthGuard)
  @Post(':postId/communities/:communityId')
  assignCommunity(
    @Param('postId') postId: string,
    @Param('communityId') communityId: string,
  ) {
    return this.postsService.assignToCommunity(+postId, +communityId);
  }

  @UseGuards(JwtCookieAuthGuard)
  @Post(':postId/collections/:collectionId')
  assignCollection(
    @Param('postId') postId: string,
    @Param('collectionId') collectionId: string,
  ) {
    return this.postsService.assignToCollection(+postId, +collectionId);
  }

  @UseGuards(JwtCookieAuthGuard)
  @Delete(':postId/categories/:categoryId')
  async unassignCategory(
    @Param('postId') postId: string,
    // @Param('categoryId') categoryId: string,
  ) {
    await this.postsService.removePostCategoryRelation(+postId);
  }

  @UseGuards(JwtCookieAuthGuard)
  @Delete(':postId/collections/:collectionId')
  async unassignCollection(
    @Param('postId') postId: string,
    // @Param('collectionId') collectionId: string,
  ) {
    await this.postsService.removePostCollectionRelation(+postId);
  }

  @UseGuards(JwtCookieAuthGuard)
  @Delete(':postId/communities/:communityId')
  async unassignCommunity(
    @Param('postId') postId: string,
    // @Param('communityId') communityId: string,
  ) {
    await this.postsService.removePostCommunityRelation(+postId);
  }
}
