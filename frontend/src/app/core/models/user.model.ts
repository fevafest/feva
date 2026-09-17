export type UserRole = 'customer' | 'organizer' | 'admin' | 'staff';

export interface User {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  organizer?: string;
  isSuperAdmin?: boolean;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
}
