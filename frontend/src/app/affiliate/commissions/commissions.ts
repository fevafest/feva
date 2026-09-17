import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AffiliateService } from '../../core/services/affiliate.service';
import { Commission, CommissionStatus } from '../../core/models/commission.model';
import { KesCurrencyPipe } from '../../shared/pipes/kes-currency.pipe';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-affiliate-commissions',
  standalone: true,
  imports: [CommonModule, KesCurrencyPipe, LoadingSpinnerComponent, EmptyStateComponent],
  templateUrl: './commissions.html',
  styleUrl: './commissions.scss',
})
export class AffiliateCommissionsComponent implements OnInit {
  private readonly affiliateService = inject(AffiliateService);

  readonly loading = signal(true);
  readonly commissions = signal<Commission[]>([]);
  readonly filter = signal<CommissionStatus | 'all'>('all');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const current = this.filter();
    const status = current === 'all' ? undefined : current;
    this.affiliateService.myCommissions(status).subscribe({
      next: (res) => {
        this.commissions.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setFilter(status: CommissionStatus | 'all'): void {
    this.filter.set(status);
    this.load();
  }

  eventTitle(c: Commission): string {
    return typeof c.event === 'string' ? '' : c.event.title;
  }

  orderNumber(c: Commission): string {
    return typeof c.order === 'string' ? '' : c.order.orderNumber;
  }
}
