import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AffiliateService } from './affiliate.service';

const STORAGE_KEY = 'feva_ref';
const ATTRIBUTION_WINDOW_DAYS = 30;

interface StoredRef {
  code: string;
  expiresAt: number;
}

/**
 * Captures `?ref=CODE` from any URL (site-wide or a specific event link),
 * remembers it in localStorage for 30 days so a later purchase still gets
 * attributed, and fires a fire-and-forget click record. Call init() once
 * from the root component.
 */
@Injectable({ providedIn: 'root' })
export class AffiliateTrackingService {
  private readonly router = inject(Router);
  private readonly affiliateService = inject(AffiliateService);
  private lastTrackedCode: string | null = null;

  init(): void {
    this.captureFromUrl(window.location.search);
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.captureFromUrl(window.location.search);
    });
  }

  getStoredCode(): string | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const record: StoredRef = JSON.parse(raw);
      if (!record.code || record.expiresAt < Date.now()) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return record.code;
    } catch {
      return null;
    }
  }

  clearStoredCode(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  private captureFromUrl(search: string): void {
    const code = new URLSearchParams(search).get('ref');
    if (!code) return;

    const normalized = code.toUpperCase().trim();
    this.storeCode(normalized);

    if (this.lastTrackedCode === normalized) return;
    this.lastTrackedCode = normalized;
    this.affiliateService.trackClick(normalized).subscribe({ error: () => {} });
  }

  private storeCode(code: string): void {
    try {
      const record: StoredRef = {
        code,
        expiresAt: Date.now() + ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch {
      /* private browsing / storage disabled - attribution just won't persist */
    }
  }
}
