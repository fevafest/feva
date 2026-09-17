import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentService, PaymentRecord } from '../../core/services/payment.service';
import { KesCurrencyPipe } from '../../shared/pipes/kes-currency.pipe';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [CommonModule, KesCurrencyPipe, LoadingSpinnerComponent, EmptyStateComponent],
  templateUrl: './admin-payments.html',
  styleUrls: ['../admin-table.scss'],
})
export class AdminPaymentsComponent implements OnInit {
  readonly loading = signal(true);
  readonly payments = signal<PaymentRecord[]>([]);
  readonly filter = signal<'all' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'>('all');

  constructor(private readonly paymentService: PaymentService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.paymentService.adminList(this.filter() === 'all' ? undefined : this.filter()).subscribe({
      next: (res) => {
        this.payments.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setFilter(value: 'all' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'): void {
    this.filter.set(value);
    this.load();
  }
}
