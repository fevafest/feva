import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PlatformSettings, PublicSettings } from '../models/settings.model';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly baseUrl = `${environment.apiUrl}/settings`;

  constructor(private readonly http: HttpClient) {}

  getPublic(): Observable<ApiResponse<PublicSettings>> {
    return this.http.get<ApiResponse<PublicSettings>>(this.baseUrl);
  }

  adminGet(): Observable<ApiResponse<PlatformSettings>> {
    return this.http.get<ApiResponse<PlatformSettings>>(`${this.baseUrl}/admin`);
  }

  adminUpdate(payload: Partial<PlatformSettings>): Observable<ApiResponse<PlatformSettings>> {
    return this.http.patch<ApiResponse<PlatformSettings>>(`${this.baseUrl}/admin`, payload);
  }
}
