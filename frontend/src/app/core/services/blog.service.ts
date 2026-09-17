import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { BlogPost } from '../models/blog.model';

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly baseUrl = `${environment.apiUrl}/blog`;

  constructor(private readonly http: HttpClient) {}

  list(query: { featured?: boolean; page?: number } = {}): Observable<ApiResponse<BlogPost[]>> {
    const params: Record<string, string | number> = {};
    if (query.featured !== undefined) params['featured'] = String(query.featured);
    if (query.page) params['page'] = query.page;
    return this.http.get<ApiResponse<BlogPost[]>>(this.baseUrl, { params });
  }

  getBySlug(slug: string): Observable<ApiResponse<BlogPost>> {
    return this.http.get<ApiResponse<BlogPost>>(`${this.baseUrl}/${slug}`);
  }

  create(formData: FormData): Observable<ApiResponse<BlogPost>> {
    return this.http.post<ApiResponse<BlogPost>>(this.baseUrl, formData);
  }

  update(id: string, formData: FormData): Observable<ApiResponse<BlogPost>> {
    return this.http.put<ApiResponse<BlogPost>>(`${this.baseUrl}/${id}`, formData);
  }

  remove(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`);
  }
}
