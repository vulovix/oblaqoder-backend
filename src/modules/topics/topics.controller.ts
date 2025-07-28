import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  NotFoundException,
  Post,
  Body,
  UseGuards,
  Put,
  Delete,
  Patch,
} from '@nestjs/common';
import { TopicsService } from './topics.service';
import { JwtCookieAuthGuard } from 'src/guards/JwtCookieAuthGuard';
import { UpdateTopicDto } from './dto/update-topic.dto';

@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get()
  findAllPublic() {
    return this.topicsService.findAllPublic();
  }

  @UseGuards(JwtCookieAuthGuard)
  @Get('all')
  findAll() {
    return this.topicsService.findAll();
  }

  @UseGuards(JwtCookieAuthGuard)
  @Post()
  create(@Body() body: { name: string; slug: string }) {
    return this.topicsService.createTopic(body);
  }

  @UseGuards(JwtCookieAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTopicDto) {
    return this.topicsService.update(+id, dto);
  }

  @UseGuards(JwtCookieAuthGuard)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.topicsService.delete(+id);
  }

  @UseGuards(JwtCookieAuthGuard)
  @Get(':id/relations')
  async getTopicWithRelations(@Param('id', ParseIntPipe) id: number) {
    const result = await this.topicsService.getTopicWithRelations(id);
    if (!result) throw new NotFoundException('Topic not found');
    return result;
  }

  @UseGuards(JwtCookieAuthGuard)
  @Patch(':id/relations')
  async updateTopicRelations(
    @Param('id', ParseIntPipe) topicId: number,
    @Body() body: { links: { type: string; id: number }[] },
  ) {
    return this.topicsService.updateTopicRelations(topicId, body.links);
  }
}
