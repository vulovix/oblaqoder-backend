import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostsModule } from './modules/posts/posts.module';
import { PostFilesModule } from './modules/post-files/post-files.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { CommunitiesModule } from './modules/communities/communities.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    UsersModule,
    PostsModule,
    PostFilesModule,
    CollectionsModule,
    CommunitiesModule,
    CategoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
