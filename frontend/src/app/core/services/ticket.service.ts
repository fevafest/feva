import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Ticket } from '../models/ticket.model';

export interface VerifyResult {
  valid: boolean;
  reason?: string;
  checkedIn?: boolean;
  ticket?: Ticket;
}

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly baseUrl = `${environment.apiUrl}/tickets`;

  constructor(private readonly http: HttpClient) {}

  myTickets(): Observable<ApiResponse<Ticket[]>> {
    return this.http.get<ApiResponse<Ticket[]>>(`${this.baseUrl}/mine`);
  }

  getById(ticketId: string): Observable<ApiResponse<Ticket>> {
    return this.http.get<ApiResponse<Ticket>>(`${this.baseUrl}/${ticketId}`);
  }

  verify(payload: {
    ticketId?: string;
    qrData?: string;
    consume?: boolean;
  }): Observable<ApiResponse<VerifyResult>> {
    return this.http.post<ApiResponse<VerifyResult>>(`${this.baseUrl}/verify`, payload);
  }

  markUsed(ticketId: string): Observable<ApiResponse<Ticket>> {
    return this.http.patch<ApiResponse<Ticket>>(`${this.baseUrl}/${ticketId}/use`, {});
  }

  adminList(query: { status?: string; search?: string } = {}): Observable<ApiResponse<Ticket[]>> {
    const params: Record<string, string> = {};
    if (query.status) params['status'] = query.status;
    if (query.search) params['search'] = query.search;
    return this.http.get<ApiResponse<Ticket[]>>(`${this.baseUrl}/admin`, { params });
  }

  adminDelete(ticketId: string): Observable<ApiResponse<{ ticketId: string }>> {
    return this.http.delete<ApiResponse<{ ticketId: string }>>(`${this.baseUrl}/${ticketId}`);
  }
}
