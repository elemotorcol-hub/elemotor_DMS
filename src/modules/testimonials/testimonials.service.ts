import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';

@Injectable()
export class TestimonialsService {
  private readonly logger = new Logger(TestimonialsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  async create(dto: CreateTestimonialDto, photo?: Express.Multer.File) {
    let photoUrl: string | undefined;
    let publicId: string | undefined;

    if (photo) {
      const uploaded = await this.uploadService.uploadImage(photo, 'elemotor/testimonials');
      photoUrl = uploaded.publicUrl;
      publicId = uploaded.publicId;
    }

    // Auto-approve 5-star reviews
    const approved = dto.rating === 5;

    try {
      return await this.prisma.testimonial.create({
        data: {
          name: dto.name,
          comment: dto.comment,
          rating: dto.rating,
          photoUrl,
          publicId,
          orderId: dto.orderId ?? null,
          approved,
        },
      });
    } catch (err) {
      this.logger.error('Error al crear testimonial:', err);
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  findPublic(rating?: number) {
    return this.prisma.testimonial.findMany({
      where: {
        approved: true,
        ...(rating ? { rating } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
