import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AffiliateService } from '../../core/services/affiliate.service';
import { NotificationService } from '../../core/services/notification.service';
import { AffiliateStats } from '../../core/models/affiliate.model';
import { KesCurrencyPipe } from '../../shared/pipes/kes-currency.pipe';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { IconComponent } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-affiliate-dashboard',
  standalone: true,
  imports: [CommonModule, KesCurrencyPipe, LoadingSpinnerComponent, EmptyStateComponent, IconComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class AffiliateDashboardComponent implements OnInit {
  private readonly affiliateService = inject(AffiliateService);
  private readonly notify = inject(NotificationService);

  readonly loading = signal(true);
  readonly stats = signal<AffiliateStats | null>(null);
  readonly copied = signal(false);

  ngOnInit(): void {
    this.affiliateService.myStats().subscribe({
      next: (res) => {
        this.stats.set(res.data ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  get shareLink(): string {
    const code = this.stats()?.affiliate?.code;
    if (!code) return '';
    return `${window.location.origin}/?ref=${code}`;
  }

  copyLink(): void {
    if (!this.shareLink) return;
    navigator.clipboard
      .writeText(this.shareLink)
      .then(() => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      })
      .catch(() => this.notify.error('Could not copy link. Please copy it manually.'));
  }
}
