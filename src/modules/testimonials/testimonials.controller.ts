import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TestimonialsService } from './testimonials.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('photo'))
  create(
    @Body() dto: CreateTestimonialDto,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    return this.testimonialsService.create(dto, photo);
  }

  @Get()
  @Public()
  findAll(@Query('rating') rating?: string) {
    return this.testimonialsService.findPublic(rating ? Number(rating) : undefined);
  }
}
