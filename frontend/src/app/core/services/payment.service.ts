import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PaymentStatus, OrderStatus } from '../models/order.model';

export interface PaymentStatusResponse {
  orderReference: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  total: number;
}

export interface PaymentRecord {
  _id: string;
  reference: string;
  provider: string;
  amount: number;
  phoneNumber: string;
  channel: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  payheroTransactionId?: string;
  resultDescription?: string;
  order: {
    orderNumber: string;
    total: number;
    user?: { fullName: string; email: string };
    event?: { title: string };
  };
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly baseUrl = `${environment.apiUrl}/payments`;

  constructor(private readonly http: HttpClient) {}

  initiate(orderReference: string): Observable<ApiResponse<{ orderReference: string; status: string }>> {
    return this.http.post<ApiResponse<{ orderReference: string; status: string }>>(
      `${this.baseUrl}/initiate`,
      { orderReference }
    );
  }

  getStatus(reference: string): Observable<ApiResponse<PaymentStatusResponse>> {
    return this.http.get<ApiResponse<PaymentStatusResponse>>(`${this.baseUrl}/status/${reference}`);
  }

  adminList(status?: string): Observable<ApiResponse<PaymentRecord[]>> {
    const params: Record<string, string> = {};
    if (status) params['status'] = status;
    return this.http.get<ApiResponse<PaymentRecord[]>>(`${this.baseUrl}/admin`, { params });
  }
}
