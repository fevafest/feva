import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../core/services/admin.service';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models/order.model';
import { KesCurrencyPipe } from '../../shared/pipes/kes-currency.pipe';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';

interface TopEventRow {
  title: string;
  ticketsSold: number;
  revenue: number;
}

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, KesCurrencyPipe, LoadingSpinnerComponent, EmptyStateComponent],
  templateUrl: './admin-reports.html',
  styleUrl: './admin-reports.scss',
})
export class AdminReportsComponent implements OnInit {
  readonly loading = signal(true);
  readonly totalRevenue = signal(0);
  readonly ticketsSold = signal(0);
  readonly revenueByDay = signal<{ date: string; revenue: number }[]>([]);
  readonly topEvents = signal<TopEventRow[]>([]);

  constructor(private readonly adminService: AdminService, private readonly orderService: OrderService) {}

  ngOnInit(): void {
    this.adminService.dashboardStats().subscribe({
      next: (res) => {
        this.totalRevenue.set(res.data?.totalRevenue ?? 0);
        this.ticketsSold.set(res.data?.ticketsSold ?? 0);
        this.revenueByDay.set(res.data?.revenueByDay ?? []);
      },
    });

    this.orderService.adminList({ status: 'PAID', limit: 100 }).subscribe({
      next: (res) => {
        this.topEvents.set(this.computeTopEvents(res.data ?? []));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private computeTopEvents(orders: Order[]): TopEventRow[] {
    const map = new Map<string, TopEventRow>();
    for (const o of orders) {
      const title = typeof o.event === 'string' ? 'Unknown Event' : o.event.title;
      const existing = map.get(title) ?? { title, ticketsSold: 0, revenue: 0 };
      existing.ticketsSold += o.quantity;
      existing.revenue += o.total;
      map.set(title, existing);
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }

  barHeight(revenue: number): number {
    const max = Math.max(...this.revenueByDay().map((d) => d.revenue), 1);
    return Math.max((revenue / max) * 100, 4);
  }
}
