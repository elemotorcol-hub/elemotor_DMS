import { Injectable, NotFoundException } from '@nestjs/common';
import { WorkshopsRepository } from './workshops.repository';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';
import { QueryWorkshopsDto } from './dto/query-workshops.dto';
import { WorkshopResponseDto } from './dto/workshop-response.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { UploadService } from '../upload/upload.service';
import { Workshop, WorkshopHour, WorkshopService as WService, WorkshopImage } from '@prisma/client';

type WorkshopWithRelations = Workshop & {
  services: WService[];
  hours: WorkshopHour[];
  images: WorkshopImage[];
  distance?: number;
};

@Injectable()
export class WorkshopsService {
  constructor(
    private readonly repository: WorkshopsRepository,
    private readonly uploadService: UploadService,
  ) {}

  async create(dto: CreateWorkshopDto) {
    return this.repository.create(dto);
  }

  async findAll(filters: QueryWorkshopsDto): Promise<PaginatedResult<WorkshopResponseDto>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;

    const [workshops, total] = await Promise.all([
      this.repository.findMany(filters),
      this.repository.count(filters),
    ]);

    const data = workshops.map(w => this.mapToResponse(w));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<WorkshopResponseDto> {
    const workshop = await this.repository.findById(id);
    if (!workshop || !workshop.active) {
      throw new NotFoundException(`Workshop #${id} not found`);
    }
    return this.mapToResponse(workshop);
  }

  async update(id: number, dto: UpdateWorkshopDto) {
    const workshop = await this.repository.findById(id);
    if (!workshop || !workshop.active) {
      throw new NotFoundException(`Workshop #${id} not found`);
    }
    return this.repository.update(id, dto);
  }

  async remove(id: number) {
    const workshop = await this.repository.findById(id);
    if (!workshop || !workshop.active) {
      throw new NotFoundException(`Workshop #${id} not found`);
    }
    return this.repository.delete(id);
  }

  // ─── Image Management ──────────────────────────────────────────────────────

  async uploadImage(id: number, file: Express.Multer.File, altText?: string, sortOrder: number = 0) {
    const workshop = await this.repository.findById(id);
    if (!workshop || !workshop.active) {
      throw new NotFoundException(`Workshop #${id} not found`);
    }

    const uploadResult = await this.uploadService.uploadImage(file, 'elemotor/workshops');

    return this.repository.createImage(id, {
      url: uploadResult.publicUrl,
      publicId: uploadResult.publicId,
      altText,
      sortOrder,
    });
  }

  // ─── Mapper & Logic ─────────────────────────────────────────────────────────

  private mapToResponse(workshop: WorkshopWithRelations): WorkshopResponseDto {
    return {
      id: workshop.id,
      name: workshop.name,
      address: workshop.address,
      city: workshop.city,
      state: workshop.state,
      latitude: workshop.latitude ? Number(workshop.latitude) : null,
      longitude: workshop.longitude ? Number(workshop.longitude) : null,
      phone: workshop.phone,
      whatsapp: workshop.whatsapp,
      email: workshop.email,
      googleMapsUrl: workshop.googleMapsUrl,
      rating: workshop.rating ? Number(workshop.rating) : null,
      description: workshop.description,
      amenities: (workshop.amenities as string[]) || [],
      isVerified: workshop.isVerified ?? true,
      active: workshop.active,
      distance: workshop.distance !== undefined ? Number(workshop.distance) : undefined,
      isOpen: this.calculateIsOpen(workshop.hours),
      services: workshop.services?.map((s: any) => s.serviceType) || [],
      hours: workshop.hours || [],
      images: workshop.images?.map((img: any) => img.url) || [],
    };
  }

  private calculateIsOpen(hours: WorkshopHour[]): boolean {
    if (!hours || hours.length === 0) return false;

    // Timezone correcto para Colombia (UTC-5)
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));

    // getDay() retorna 0 (Dom)–6 (Sab). Mapeamos a 1(Lun)–7(Dom).
    let currentDay = now.getDay();
    if (currentDay === 0) currentDay = 7;

    const todayHours = hours.find(h => h.dayOfWeek === currentDay);

    if (!todayHours || todayHours.isClosed || !todayHours.openTime || !todayHours.closeTime) {
      return false;
    }

    const currentTime = now.getHours() * 100 + now.getMinutes();
    const [openH, openM] = todayHours.openTime.split(':').map(Number);
    const [closeH, closeM] = todayHours.closeTime.split(':').map(Number);

    const openTimeNum = openH * 100 + openM;
    const closeTimeNum = closeH * 100 + closeM;

    return currentTime >= openTimeNum && currentTime < closeTimeNum;
  }
}
