export type CommissionStatus = 'PENDING' | 'AVAILABLE' | 'PAID';

export interface Commission {
  _id: string;
  affiliate: { _id: string; displayName: string; code: string } | string;
  order: { _id: string; orderNumber: string; quantity: number; total: number; createdAt: string } | string;
  event: { _id: string; title: string; venue?: string; startDate: string } | string;
  baseAmount: number;
  commissionPercent: number;
  commissionAmount: number;
  status: CommissionStatus;
  paidAt?: string;
  createdAt: string;
}
