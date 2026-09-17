export interface OrderItem {
  ticketTypeId: string;
  ticketTypeName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export type PaymentStatus = 'PENDING' | 'PAYMENT_PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED';

export interface EventSummary {
  _id: string;
  title: string;
  slug: string;
  posterImage: string;
  venue: string;
  location: string;
  startDate: string;
  startTime: string;
}

export interface OrderUserSummary {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: string | OrderUserSummary;
  event: EventSummary | string;
  items: OrderItem[];
  tickets: string[];
  quantity: number;
  subtotal: number;
  fees: number;
  total: number;
  phoneNumber: string;
  paymentReference: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paidAt?: string;
  createdAt: string;
}
