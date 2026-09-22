import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, interval, of } from 'rxjs';
import { catchError, startWith, switchMap } from 'rxjs/operators';
import { PaymentService, PaymentRecord } from '../../core/services/payment.service';
import { KesCurrencyPipe } from '../../shared/pipes/kes-currency.pipe';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';

type PaymentFilter = 'all' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

const REFRESH_INTERVAL_MS = 5000;

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [CommonModule, KesCurrencyPipe, LoadingSpinnerComponent, EmptyStateComponent],
  templateUrl: './admin-payments.html',
  styleUrls: ['../admin-table.scss', './admin-payments.scss'],
})
export class AdminPaymentsComponent implements OnInit, OnDestroy {
  readonly loading = signal(true);
  readonly payments = signal<PaymentRecord[]>([]);
  readonly filter = signal<PaymentFilter>('all');
  readonly lastUpdated = signal<Date | null>(null);

  private pollSub?: Subscription;

  constructor(private readonly paymentService: PaymentService) {}

  ngOnInit(): void {
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  setFilter(value: PaymentFilter): void {
    this.filter.set(value);
    this.startPolling();
  }

  trackById(_index: number, payment: PaymentRecord): string {
    return payment._id;
  }

  phoneFor(payment: PaymentRecord): string {
    return payment.phoneNumber || payment.order?.user?.phoneNumber || '—';
  }

  // Re-fetches on a short interval so a payment that PayHero confirms (or
  // rejects) shows up as SUCCESS/FAILED without the admin reloading the page.
  private startPolling(): void {
    this.pollSub?.unsubscribe();
    this.loading.set(true);

    this.pollSub = interval(REFRESH_INTERVAL_MS)
      .pipe(
        startWith(0),
        switchMap(() =>
          this.paymentService
            .adminList(this.filter() === 'all' ? undefined : this.filter())
            // Swallow a failed poll so one blip doesn't kill the interval.
            .pipe(catchError(() => of(null)))
        )
      )
      .subscribe((res) => {
        if (res) {
          this.payments.set(res.data ?? []);
          this.lastUpdated.set(new Date());
        }
        this.loading.set(false);
      });
  }
}
