import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { NotificationService } from '../../core/services/notification.service';
import { User, UserRole } from '../../core/models/user.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent, EmptyStateComponent],
  templateUrl: './admin-users.html',
  styleUrls: ['../admin-table.scss'],
})
export class AdminUsersComponent implements OnInit {
  readonly loading = signal(true);
  readonly users = signal<User[]>([]);
  readonly roleFilter = signal<UserRole | 'all'>('all');
  readonly search = signal('');

  constructor(private readonly adminService: AdminService, private readonly notify: NotificationService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.adminService
      .listUsers({ role: this.roleFilter() === 'all' ? undefined : this.roleFilter(), search: this.search() || undefined })
      .subscribe({
        next: (res) => {
          this.users.set(res.data ?? []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  setRoleFilter(role: UserRole | 'all'): void {
    this.roleFilter.set(role);
    this.load();
  }

  toggleActive(user: User): void {
    this.adminService.updateUserStatus(user._id, { isActive: !user.isActive }).subscribe({
      next: () => {
        this.notify.success(user.isActive ? 'User deactivated.' : 'User activated.');
        this.load();
      },
      error: (err) => this.notify.error(err.error?.message || 'Could not update user.'),
    });
  }
}
