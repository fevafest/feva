export type UserRole = 'customer' | 'organizer' | 'admin' | 'staff' | 'affiliate';

export interface User {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  organizer?: string;
  affiliate?: string;
  isSuperAdmin?: boolean;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
}
