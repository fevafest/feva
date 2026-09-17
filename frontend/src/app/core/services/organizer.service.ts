import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Organizer } from '../models/organizer.model';

export interface OrganizerStats {
  totalEvents: number;
  totalRevenue: number;
  totalTicketsSold: number;
  perEvent: { eventId: string; title: string; ticketsSold: number; revenue: number; status: string }[];
}

@Injectable({ providedIn: 'root' })
export class OrganizerService {
  private readonly baseUrl = `${environment.apiUrl}/organizers`;

  constructor(private readonly http: HttpClient) {}

  register(formData: FormData): Observable<ApiResponse<Organizer>> {
    return this.http.post<ApiResponse<Organizer>>(`${this.baseUrl}/register`, formData);
  }

  me(): Observable<ApiResponse<Organizer>> {
    return this.http.get<ApiResponse<Organizer>>(`${this.baseUrl}/me`);
  }

  myStats(): Observable<ApiResponse<OrganizerStats>> {
    return this.http.get<ApiResponse<OrganizerStats>>(`${this.baseUrl}/me/stats`);
  }

  adminList(approved?: boolean): Observable<ApiResponse<Organizer[]>> {
    const params: Record<string, string> = {};
    if (approved !== undefined) params['approved'] = String(approved);
    return this.http.get<ApiResponse<Organizer[]>>(this.baseUrl, { params });
  }

  approve(id: string): Observable<ApiResponse<Organizer>> {
    return this.http.patch<ApiResponse<Organizer>>(`${this.baseUrl}/${id}/approve`, {});
  }
}
