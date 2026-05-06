import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { BlogRepository } from './blog.repository';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostDto } from './dto/query-post.dto';

@Injectable()
export class BlogService {
  constructor(private readonly repo: BlogRepository) {}

  // ─── Público ──────────────────────────────────────────────────────────────

  async findPublished(query: QueryPostDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const [data, total] = await Promise.all([
      this.repo.findMany(query, true),
      this.repo.count(query, true),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findPublishedBySlug(slug: string) {
    const post = await this.repo.findBySlug(slug, true);
    if (!post) throw new NotFoundException(`Post "${slug}" not found`);
    return post;
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  async findAll(query: QueryPostDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const [data, total] = await Promise.all([
      this.repo.findMany(query, false),
      this.repo.count(query, false),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: number) {
    const post = await this.repo.findById(id);
    if (!post) throw new NotFoundException(`Post #${id} not found`);
    return post;
  }

  async create(authorId: number, dto: CreatePostDto) {
    await this.assertSlugUnique(dto.slug);
    return this.repo.create(authorId, dto);
  }

  async update(id: number, dto: UpdatePostDto) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(`Post #${id} not found`);

    if (dto.slug && dto.slug !== existing.slug) {
      await this.assertSlugUnique(dto.slug, id);
    }

    return this.repo.update(id, dto);
  }

  async remove(id: number) {
    const post = await this.repo.findById(id);
    if (!post) throw new NotFoundException(`Post #${id} not found`);
    return this.repo.delete(id);
  }

  private async assertSlugUnique(slug: string, excludeId?: number) {
    const conflict = await this.repo.findBySlugForConflict(slug, excludeId);
    if (conflict) {
      throw new ConflictException(`Slug "${slug}" ya está en uso`);
    }
  }
}
