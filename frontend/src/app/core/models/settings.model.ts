export interface PublicSettings {
  contactEmail: string;
  contactPhone: string;
  siteTagline: string;
  currency?: string;
}

export interface PlatformSettings extends PublicSettings {
  _id: string;
  platformFeePercent: number;
  platformFeeFixed: number;
  affiliateDefaultCommissionPercent: number;
  clientUrl?: string;
  createdAt: string;
  updatedAt: string;
}
