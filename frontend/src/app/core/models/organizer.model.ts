export interface Organizer {
  _id: string;
  user: { _id: string; fullName: string; email: string; phoneNumber: string } | string;
  businessName: string;
  description?: string;
  logo?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  isApproved: boolean;
  isVerified: boolean;
  totalRevenue: number;
  totalTicketsSold: number;
  createdAt: string;
}
