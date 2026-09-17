import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Affiliate, AffiliateEventRate, AffiliateStats, AffiliateType } from '../models/affiliate.model';
import { Commission, CommissionStatus } from '../models/commission.model';

export interface RegisterAffiliatePayload {
  displayName: string;
  type: AffiliateType;
  bio?: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  website?: string;
}

@Injectable({ providedIn: 'root' })
export class AffiliateService {
  private readonly baseUrl = `${environment.apiUrl}/affiliates`;

  constructor(private readonly http: HttpClient) {}

  // --- Self-service ---
  register(payload: RegisterAffiliatePayload): Observable<ApiResponse<Affiliate>> {
    return this.http.post<ApiResponse<Affiliate>>(`${this.baseUrl}/register`, payload);
  }

  me(): Observable<ApiResponse<Affiliate>> {
    return this.http.get<ApiResponse<Affiliate>>(`${this.baseUrl}/me`);
  }

  myStats(): Observable<ApiResponse<AffiliateStats>> {
    return this.http.get<ApiResponse<AffiliateStats>>(`${this.baseUrl}/me/stats`);
  }

  myCommissions(status?: CommissionStatus): Observable<ApiResponse<Commission[]>> {
    const params: Record<string, string> = {};
    if (status) params['status'] = status;
    return this.http.get<ApiResponse<Commission[]>>(`${this.baseUrl}/me/commissions`, { params });
  }

  // --- Public click tracking ---
  trackClick(code: string, eventId?: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.baseUrl}/track-click`, { code, eventId });
  }

  // --- Admin: affiliate management ---
  adminList(approved?: boolean): Observable<ApiResponse<Affiliate[]>> {
    const params: Record<string, string> = {};
    if (approved !== undefined) params['approved'] = String(approved);
    return this.http.get<ApiResponse<Affiliate[]>>(this.baseUrl, { params });
  }

  adminApprove(id: string): Observable<ApiResponse<Affiliate>> {
    return this.http.patch<ApiResponse<Affiliate>>(`${this.baseUrl}/${id}/approve`, {});
  }

  adminSetActive(id: string, isActive: boolean): Observable<ApiResponse<Affiliate>> {
    return this.http.patch<ApiResponse<Affiliate>>(`${this.baseUrl}/${id}/status`, { isActive });
  }

  adminSetDefaultRate(id: string, defaultCommissionPercent: number): Observable<ApiResponse<Affiliate>> {
    return this.http.patch<ApiResponse<Affiliate>>(`${this.baseUrl}/${id}/rate`, {
      defaultCommissionPercent,
    });
  }

  adminGetStats(id: string): Observable<ApiResponse<AffiliateStats>> {
    return this.http.get<ApiResponse<AffiliateStats>>(`${this.baseUrl}/${id}/stats`);
  }

  adminListEventRates(id: string): Observable<ApiResponse<AffiliateEventRate[]>> {
    return this.http.get<ApiResponse<AffiliateEventRate[]>>(`${this.baseUrl}/${id}/event-rates`);
  }

  adminSetEventRate(
    id: string,
    eventId: string,
    commissionPercent: number
  ): Observable<ApiResponse<AffiliateEventRate>> {
    return this.http.put<ApiResponse<AffiliateEventRate>>(`${this.baseUrl}/${id}/event-rates`, {
      eventId,
      commissionPercent,
    });
  }

  adminRemoveEventRate(id: string, eventId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}/event-rates/${eventId}`);
  }

  // --- Admin: payouts ---
  adminListCommissions(query: {
    affiliate?: string;
    status?: CommissionStatus;
    page?: number;
  } = {}): Observable<ApiResponse<Commission[]>> {
    const params: Record<string, string | number> = {};
    if (query.affiliate) params['affiliate'] = query.affiliate;
    if (query.status) params['status'] = query.status;
    if (query.page) params['page'] = query.page;
    return this.http.get<ApiResponse<Commission[]>>(`${this.baseUrl}/commissions`, { params });
  }

  adminUpdateCommissionStatus(id: string, status: CommissionStatus): Observable<ApiResponse<Commission>> {
    return this.http.patch<ApiResponse<Commission>>(`${this.baseUrl}/commissions/${id}/status`, {
      status,
    });
  }

  adminBulkMarkPaid(affiliateId: string): Observable<ApiResponse<{ modifiedCount: number }>> {
    return this.http.post<ApiResponse<{ modifiedCount: number }>>(`${this.baseUrl}/commissions/mark-paid`, {
      affiliateId,
    });
  }
}
