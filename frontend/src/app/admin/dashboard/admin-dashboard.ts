import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService, AdminDashboardStats } from '../../core/services/admin.service';
import { KesCurrencyPipe } from '../../shared/pipes/kes-currency.pipe';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { IconComponent } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, KesCurrencyPipe, LoadingSpinnerComponent, IconComponent],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboardComponent implements OnInit {
  readonly loading = signal(true);
  readonly stats = signal<AdminDashboardStats | null>(null);

  constructor(private readonly adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.dashboardStats().subscribe({
      next: (res) => {
        this.stats.set(res.data ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  barHeight(revenue: number): number {
    const s = this.stats();
    if (!s) return 4;
    const max = Math.max(...s.revenueByDay.map((d) => d.revenue), 1);
    return Math.max((revenue / max) * 100, 4);
  }
}
