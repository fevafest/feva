import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastContainerComponent } from '../../components/toast-container/toast-container';
import { IconComponent, IconName } from '../../components/icon/icon';

export interface DashboardNavItem {
  label: string;
  path: string;
  icon: IconName;
  end?: boolean;
  /** Only shown to admins flagged isSuperAdmin — used for Payments/Admins. */
  superAdminOnly?: boolean;
}

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, ToastContainerComponent, IconComponent],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.scss',
})
export class DashboardLayoutComponent {
  @Input() portalName = 'Dashboard';
  @Input() navItems: DashboardNavItem[] = [];

  readonly sidebarOpen = signal(false);
  readonly visibleNavItems = computed(() =>
    this.navItems.filter((item) => !item.superAdminOnly || this.auth.isSuperAdmin())
  );

  constructor(readonly auth: AuthService) {}

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
  }
}
