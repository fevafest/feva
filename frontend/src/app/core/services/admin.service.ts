import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { User } from '../models/user.model';

export interface AdminRecentOrder {
  _id: string;
  orderNumber: string;
  user: { fullName: string; email: string };
  event: { title: string };
  total: number;
  paymentStatus: string;
  createdAt: string;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalEvents: number;
  publishedEvents: number;
  ticketsSold: number;
  totalRevenue: number;
  pendingOrders: number;
  recentOrders: AdminRecentOrder[];
  revenueByDay: { date: string; revenue: number }[];
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly baseUrl = `${environment.apiUrl}/admin`;
  private readonly usersUrl = `${environment.apiUrl}/users`;

  constructor(private readonly http: HttpClient) {}

  dashboardStats(): Observable<ApiResponse<AdminDashboardStats>> {
    return this.http.get<ApiResponse<AdminDashboardStats>>(`${this.baseUrl}/dashboard`);
  }

  listUsers(query: { role?: string; search?: string; page?: number } = {}): Observable<ApiResponse<User[]>> {
    const params: Record<string, string | number> = {};
    if (query.role) params['role'] = query.role;
    if (query.search) params['search'] = query.search;
    if (query.page) params['page'] = query.page;
    return this.http.get<ApiResponse<User[]>>(this.usersUrl, { params });
  }

  updateUserStatus(id: string, body: { isActive?: boolean; role?: string }): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(`${this.usersUrl}/${id}/status`, body);
  }

  listAdmins(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.baseUrl}/admins`);
  }

  createAdmin(payload: {
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
    isSuperAdmin: boolean;
  }): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.baseUrl}/admins`, payload);
  }

  setSuperAdminStatus(id: string, isSuperAdmin: boolean): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(`${this.baseUrl}/admins/${id}/superadmin`, { isSuperAdmin });
  }
}
