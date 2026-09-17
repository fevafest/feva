import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService, DashboardOverview } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { Order, EventSummary } from '../../core/models/order.model';
import { KesCurrencyPipe } from '../../shared/pipes/kes-currency.pipe';
import { FileUrlPipe } from '../../shared/pipes/file-url.pipe';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { IconComponent } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [CommonModule, RouterLink, KesCurrencyPipe, FileUrlPipe, LoadingSpinnerComponent, EmptyStateComponent, IconComponent],
  templateUrl: './overview.html',
  styleUrl: './overview.scss',
})
export class DashboardOverviewComponent implements OnInit {
  readonly loading = signal(true);
  readonly overview = signal<DashboardOverview | null>(null);

  constructor(readonly auth: AuthService, private readonly userService: UserService) {}

  ngOnInit(): void {
    this.userService.dashboardOverview().subscribe({
      next: (res) => {
        this.overview.set(res.data ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  eventTitle(order: Order): string {
    return typeof order.event === 'string' ? '' : (order.event as EventSummary).title;
  }
}
