import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { FevaEvent } from '../models/event.model';

export interface EventQuery {
  search?: string;
  category?: string;
  city?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
}

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly baseUrl = `${environment.apiUrl}/events`;

  constructor(private readonly http: HttpClient) {}

  list(query: EventQuery = {}): Observable<ApiResponse<FevaEvent[]>> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<ApiResponse<FevaEvent[]>>(this.baseUrl, { params });
  }

  getCategories(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.baseUrl}/categories`);
  }

  getBySlug(slug: string): Observable<ApiResponse<FevaEvent>> {
    return this.http.get<ApiResponse<FevaEvent>>(`${this.baseUrl}/${slug}`);
  }

  getById(id: string): Observable<ApiResponse<FevaEvent>> {
    return this.http.get<ApiResponse<FevaEvent>>(`${this.baseUrl}/id/${id}`);
  }

  myEvents(): Observable<ApiResponse<FevaEvent[]>> {
    return this.http.get<ApiResponse<FevaEvent[]>>(`${this.baseUrl}/mine`);
  }

  adminListAll(status?: string): Observable<ApiResponse<FevaEvent[]>> {
    const params: Record<string, string> = {};
    if (status) params['status'] = status;
    return this.http.get<ApiResponse<FevaEvent[]>>(`${this.baseUrl}/admin/all`, { params });
  }

  create(formData: FormData): Observable<ApiResponse<FevaEvent>> {
    return this.http.post<ApiResponse<FevaEvent>>(this.baseUrl, formData);
  }

  update(id: string, formData: FormData): Observable<ApiResponse<FevaEvent>> {
    return this.http.put<ApiResponse<FevaEvent>>(`${this.baseUrl}/${id}`, formData);
  }

  remove(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`);
  }

  setStatus(id: string, status: string): Observable<ApiResponse<FevaEvent>> {
    return this.http.patch<ApiResponse<FevaEvent>>(`${this.baseUrl}/${id}/status`, { status });
  }
}
