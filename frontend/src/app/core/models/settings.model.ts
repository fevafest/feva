export interface PublicSettings {
  contactEmail: string;
  contactPhone: string;
  siteTagline: string;
}

export interface PlatformSettings extends PublicSettings {
  _id: string;
  platformFeePercent: number;
  platformFeeFixed: number;
  affiliateDefaultCommissionPercent: number;
  createdAt: string;
  updatedAt: string;
}
