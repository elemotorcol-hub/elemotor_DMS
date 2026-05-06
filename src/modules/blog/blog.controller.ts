import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { BlogService } from './blog.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('blog')
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  // ─── Público ──────────────────────────────────────────────────────────────

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar posts publicados' })
  findPublished(@Query() query: QueryPostDto) {
    return this.blogService.findPublished(query);
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Obtener post publicado por slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.blogService.findPublishedBySlug(slug);
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  @Get('admin/all')
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Listar todos los posts (draft + published)' })
  findAll(@Query() query: QueryPostDto) {
    return this.blogService.findAll(query);
  }

  @Get('admin/:id')
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Obtener post por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.blogService.findOne(id);
  }

  @Post()
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Crear post' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreatePostDto, @Request() req: { user: { sub: number } }) {
    return this.blogService.create(req.user.sub, dto);
  }

  @Patch(':id')
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Actualizar post' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePostDto) {
    return this.blogService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.admin, UserRole.super_admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Super Admin] Eliminar post' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.blogService.remove(id);
  }
}
