import { Injectable } from '@nestjs/common';
import { Prisma, PostStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostDto } from './dto/query-post.dto';

export const POST_LIST_SELECT = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  coverUrl: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, name: true, avatarUrl: true } },
} satisfies Prisma.PostSelect;

export const POST_DETAIL_SELECT = {
  ...POST_LIST_SELECT,
  content: true,
  coverPublicId: true,
} satisfies Prisma.PostSelect;

@Injectable()
export class BlogRepository {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(query: QueryPostDto, publicOnly = false): Prisma.PostWhereInput {
    const where: Prisma.PostWhereInput = {};

    if (publicOnly) {
      where.status = PostStatus.published;
    } else if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { excerpt: { contains: query.search } },
      ];
    }

    return where;
  }

  findMany(query: QueryPostDto, publicOnly = false) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = this.buildWhere(query, publicOnly);

    return this.prisma.post.findMany({
      where,
      select: POST_LIST_SELECT,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  count(query: QueryPostDto, publicOnly = false) {
    return this.prisma.post.count({ where: this.buildWhere(query, publicOnly) });
  }

  findBySlug(slug: string, publicOnly = false) {
    return this.prisma.post.findFirst({
      where: {
        slug,
        ...(publicOnly ? { status: PostStatus.published } : {}),
      },
      select: POST_DETAIL_SELECT,
    });
  }

  findById(id: number) {
    return this.prisma.post.findUnique({
      where: { id },
      select: POST_DETAIL_SELECT,
    });
  }

  create(authorId: number, dto: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        ...dto,
        authorId,
      },
      select: POST_DETAIL_SELECT,
    });
  }

  update(id: number, dto: UpdatePostDto) {
    return this.prisma.post.update({
      where: { id },
      data: dto,
      select: POST_DETAIL_SELECT,
    });
  }

  delete(id: number) {
    return this.prisma.post.delete({ where: { id } });
  }

  findBySlugForConflict(slug: string, excludeId?: number) {
    return this.prisma.post.findFirst({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
  }
}
