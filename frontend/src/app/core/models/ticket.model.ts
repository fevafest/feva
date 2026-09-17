import { EventSummary } from './order.model';

export type TicketStatus = 'VALID' | 'USED' | 'CANCELLED';

export interface TicketHolder {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
}

export interface Ticket {
  _id: string;
  ticketId: string;
  order: string;
  user: string | TicketHolder;
  event: EventSummary;
  ticketTypeId: string;
  ticketTypeName: string;
  price: number;
  qrData: string;
  qrCodeImage: string;
  status: TicketStatus;
  usedAt?: string;
  createdAt: string;
}
