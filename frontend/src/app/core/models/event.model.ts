export interface TicketType {
  _id: string;
  name: string;
  price: number;
  quantityTotal: number;
  quantitySold: number;
  description?: string;
}

export type EventStatus = 'draft' | 'pending_approval' | 'published' | 'unpublished' | 'cancelled';

export interface OrganizerSummary {
  _id: string;
  businessName: string;
  logo?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  isVerified?: boolean;
}

export interface FevaEvent {
  _id: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  posterImage: string;
  gallery?: string[];
  venue: string;
  location: string;
  address?: string;
  startDate: string;
  endDate?: string;
  startTime: string;
  endTime?: string;
  organizer: OrganizerSummary;
  ticketTypes: TicketType[];
  status: EventStatus;
  isFeatured: boolean;
  tags?: string[];
  minPrice?: number;
  totalAvailable?: number;
  createdAt: string;
}

export const EVENT_CATEGORIES = [
  'Music',
  'Festivals',
  'Concerts',
  'Sports',
  'Comedy',
  'Nightlife',
  'Conferences',
  'Food & Lifestyle',
] as const;
