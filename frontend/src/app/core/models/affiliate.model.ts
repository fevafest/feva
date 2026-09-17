export type AffiliateType = 'influencer' | 'dj' | 'promoter' | 'brand' | 'other';

export interface AffiliateSocialLinks {
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  website?: string;
}

export interface Affiliate {
  _id: string;
  user: { _id: string; fullName: string; email: string; phoneNumber: string } | string;
  code: string;
  displayName: string;
  type: AffiliateType;
  bio?: string;
  socialLinks?: AffiliateSocialLinks;
  defaultCommissionPercent: number;
  isApproved: boolean;
  isActive: boolean;
  totalClicks: number;
  createdAt: string;
}

export interface AffiliateEventRate {
  _id: string;
  affiliate: string;
  event: { _id: string; title: string; startDate: string } | string;
  commissionPercent: number;
}

export interface AffiliatePerEventStat {
  eventId: string;
  title: string;
  ticketsSold: number;
  revenue: number;
}

export interface AffiliateStats {
  affiliate: Affiliate;
  totalClicks: number;
  ticketsSold: number;
  revenueGenerated: number;
  paidOrderCount: number;
  conversionRate: number;
  commissionEarned: number;
  commissionPending: number;
  commissionAvailable: number;
  commissionPaid: number;
  perEvent: AffiliatePerEventStat[];
}
