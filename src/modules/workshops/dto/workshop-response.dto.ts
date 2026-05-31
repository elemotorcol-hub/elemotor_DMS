import { ServiceType } from '@prisma/client';

export interface WorkshopHourResponse {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
}

export interface WorkshopImageResponse {
  id: number;
  url: string;
  altText: string | null;
  sortOrder: number;
}

export class WorkshopResponseDto {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  googleMapsUrl: string | null;
  rating: number | null;
  description: string | null;
  amenities: string[];
  isVerified: boolean;
  active: boolean;
  isOpen: boolean; // Calculated server-side
  distance?: number; // Optional distance from geo-search
  services: ServiceType[];
  hours: WorkshopHourResponse[];
  images: string[]; // Front-end expects simple string array
}
