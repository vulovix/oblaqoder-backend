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
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import {
  InsertPostCategory,
  InsertPostCollection,
  InsertPostCommunity,
} from 'src/configuration/db/schema';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // @Get()
  // async getPosts(
  //   @Query('limit') limit: number,
  //   @Query('offset') offset: number,
  // ) {
  //   return this.postsService.getPaginatedPosts(+limit, +offset);
  // }

  @Get('calendar')
  async getPosts(@Query('includeHiddenSources') includeHiddenSources?: string) {
    const showHiddenSources = includeHiddenSources === 'true';
    return this.postsService.getCalendarPosts(showHiddenSources);
  }

  @Get('wall/paginated')
  async getPaginatedPostsByDate(
    @Query('limit') limit: number,
    @Query('offset') offset: number,
    @Query('date') date?: string, // Optional, e.g. "2025-09-08"
    @Query('includeHiddenSources') includeHiddenSources?: string,
  ) {
    const showHiddenSources = includeHiddenSources === 'true';
    return this.postsService.getPaginatedPostsByDate(
      +limit,
      +offset,
      date,
      showHiddenSources,
    );
  }

  @Get('filtered/paginated')
  async getPaginatedPostsByRelation(
    @Query('categoryId') categoryId?: number,
    @Query('collectionId') collectionId?: number,
    @Query('communityId') communityId?: number,
    @Query('limit') limit = 10,
    @Query('offset') offset = 0,
  ) {
    if (categoryId)
      return this.postsService.getPaginatedPostsByCategory(
        +categoryId,
        +limit,
        +offset,
      );
    if (collectionId)
      return this.postsService.getPaginatedPostsByCollection(
        +collectionId,
        +limit,
        +offset,
      );
    if (communityId)
      return this.postsService.getPaginatedPostsByCommunity(
        +communityId,
        +limit,
        +offset,
      );
    return [];
  }

  @Get('filtered')
  async getPostsByRelation(
    @Query('categoryId') categoryId?: number,
    @Query('collectionId') collectionId?: number,
    @Query('communityId') communityId?: number,
  ) {
    if (categoryId) return this.postsService.getPostsByCategory(+categoryId);
    if (collectionId)
      return this.postsService.getPostsByCollection(+collectionId);
    if (communityId) return this.postsService.getPostsByCommunity(+communityId);
    return [];
  }

  @Post()
  async createPost(@Body() dto: CreatePostDto) {
    return this.postsService.createPost(dto);
  }

  @Get(':id')
  async getPost(@Param('id') id: string) {
    return this.postsService.getPostById(+id);
  }

  @Delete(':id')
  async deletePost(@Param('id') id: string) {
    return this.postsService.deletePost(+id);
  }

  @Put(':id')
  async updatePost(
    @Param('id') id: string,
    @Body() dto: Partial<CreatePostDto>,
  ) {
    return this.postsService.updatePost(+id, dto);
  }

  @Post(':postId/categories/:categoryId')
  assignCategory(
    @Param('postId') postId: string,
    @Param('categoryId') categoryId: string,
  ) {
    return this.postsService.assignToCategory(+postId, +categoryId);
  }

  @Post(':postId/communities/:communityId')
  assignCommunity(
    @Param('postId') postId: string,
    @Param('communityId') communityId: string,
  ) {
    return this.postsService.assignToCommunity(+postId, +communityId);
  }

  @Post(':postId/collections/:collectionId')
  assignCollection(
    @Param('postId') postId: string,
    @Param('collectionId') collectionId: string,
  ) {
    return this.postsService.assignToCollection(+postId, +collectionId);
  }

  @Put(':postId/categories/:categoryId')
  async reassignCategory(
    @Param('postId') postId: string,
    @Param('categoryId') categoryId: string,
  ): Promise<InsertPostCategory[]> {
    await this.postsService.removePostCategoryRelation(+postId);
    return this.postsService.assignToCategory(+postId, +categoryId);
  }

  @Put(':postId/collections/:collectionId')
  async reassignCollection(
    @Param('postId') postId: string,
    @Param('collectionId') collectionId: string,
  ): Promise<InsertPostCollection[]> {
    await this.postsService.removePostCollectionRelation(+postId);
    return this.postsService.assignToCollection(+postId, +collectionId);
  }

  @Put(':postId/communities/:communityId')
  async reassignCommunity(
    @Param('postId') postId: string,
    @Param('communityId') communityId: string,
  ): Promise<InsertPostCommunity[]> {
    await this.postsService.removePostCommunityRelation(+postId);
    return this.postsService.assignToCommunity(+postId, +communityId);
  }

  @Delete(':postId/categories/:categoryId')
  async unassignCategory(
    @Param('postId') postId: string,
    // @Param('categoryId') categoryId: string,
  ) {
    await this.postsService.removePostCategoryRelation(+postId);
  }

  @Delete(':postId/collections/:collectionId')
  async unassignCollection(
    @Param('postId') postId: string,
    // @Param('collectionId') collectionId: string,
  ) {
    await this.postsService.removePostCollectionRelation(+postId);
  }

  @Delete(':postId/communities/:communityId')
  async unassignCommunity(
    @Param('postId') postId: string,
    // @Param('communityId') communityId: string,
  ) {
    await this.postsService.removePostCommunityRelation(+postId);
  }
}
