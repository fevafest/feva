import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AffiliateService } from '../../core/services/affiliate.service';
import { NotificationService } from '../../core/services/notification.service';
import { Commission, CommissionStatus } from '../../core/models/commission.model';
import { Affiliate } from '../../core/models/affiliate.model';
import { KesCurrencyPipe } from '../../shared/pipes/kes-currency.pipe';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-admin-payouts',
  standalone: true,
  imports: [CommonModule, FormsModule, KesCurrencyPipe, LoadingSpinnerComponent, EmptyStateComponent],
  templateUrl: './admin-payouts.html',
  styleUrls: ['../admin-table.scss'],
})
export class AdminPayoutsComponent implements OnInit {
  private readonly affiliateService = inject(AffiliateService);
  private readonly notify = inject(NotificationService);

  readonly loading = signal(true);
  readonly commissions = signal<Commission[]>([]);
  readonly affiliates = signal<Affiliate[]>([]);
  readonly statusFilter = signal<CommissionStatus | 'all'>('all');
  readonly affiliateFilter = signal('');

  ngOnInit(): void {
    this.affiliateService.adminList(true).subscribe({ next: (res) => this.affiliates.set(res.data ?? []) });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const currentStatus = this.statusFilter();
    const status = currentStatus === 'all' ? undefined : currentStatus;
    this.affiliateService
      .adminListCommissions({
        status,
        affiliate: this.affiliateFilter() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.commissions.set(res.data ?? []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  setStatusFilter(status: CommissionStatus | 'all'): void {
    this.statusFilter.set(status);
    this.load();
  }

  setAffiliateFilter(id: string): void {
    this.affiliateFilter.set(id);
    this.load();
  }

  affiliateName(c: Commission): string {
    return typeof c.affiliate === 'string' ? '' : c.affiliate.displayName;
  }

  eventTitle(c: Commission): string {
    return typeof c.event === 'string' ? '' : c.event.title;
  }

  orderNumber(c: Commission): string {
    return typeof c.order === 'string' ? '' : c.order.orderNumber;
  }

  updateStatus(commission: Commission, status: CommissionStatus): void {
    this.affiliateService.adminUpdateCommissionStatus(commission._id, status).subscribe({
      next: () => {
        this.notify.success(`Commission marked ${status}.`);
        this.load();
      },
      error: (err) => this.notify.error(err.error?.message || 'Could not update commission.'),
    });
  }

  bulkMarkPaid(): void {
    if (!this.affiliateFilter()) {
      this.notify.error('Select an affiliate first to bulk mark their available commissions as paid.');
      return;
    }
    this.affiliateService.adminBulkMarkPaid(this.affiliateFilter()).subscribe({
      next: (res) => {
        this.notify.success(`${res.data?.modifiedCount ?? 0} commission(s) marked paid.`);
        this.load();
      },
      error: (err) => this.notify.error(err.error?.message || 'Could not process payout.'),
    });
  }
}
