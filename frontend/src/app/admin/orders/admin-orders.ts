import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../core/services/order.service';
import { Order, PaymentStatus, EventSummary, OrderUserSummary } from '../../core/models/order.model';
import { KesCurrencyPipe } from '../../shared/pipes/kes-currency.pipe';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, KesCurrencyPipe, LoadingSpinnerComponent, EmptyStateComponent],
  templateUrl: './admin-orders.html',
  styleUrls: ['../admin-table.scss'],
})
export class AdminOrdersComponent implements OnInit {
  readonly loading = signal(true);
  readonly orders = signal<Order[]>([]);
  readonly filter = signal<PaymentStatus | 'all'>('all');

  constructor(private readonly orderService: OrderService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.orderService.adminList({ status: this.filter() === 'all' ? undefined : this.filter(), limit: 50 }).subscribe({
      next: (res) => {
        this.orders.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setFilter(status: PaymentStatus | 'all'): void {
    this.filter.set(status);
    this.load();
  }

  userOf(order: Order): OrderUserSummary | null {
    return typeof order.user === 'string' ? null : order.user;
  }

  eventOf(order: Order): EventSummary | null {
    return typeof order.event === 'string' ? null : order.event;
  }
}
