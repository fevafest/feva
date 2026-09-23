import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { TicketService } from '../../core/services/ticket.service';
import { NotificationService } from '../../core/services/notification.service';
import { User, UserRole } from '../../core/models/user.model';
import { Ticket, TicketHolder } from '../../core/models/ticket.model';
import { IconComponent } from '../../shared/components/icon/icon';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';

type TicketTab = 'VALID' | 'USED';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, LoadingSpinnerComponent, EmptyStateComponent],
  templateUrl: './admin-users.html',
  styleUrls: ['../admin-table.scss', './admin-users.scss'],
})
export class AdminUsersComponent implements OnInit {
  readonly loading = signal(true);
  readonly users = signal<User[]>([]);
  readonly roleFilter = signal<UserRole | 'all'>('all');
  readonly search = signal('');

  readonly ticketsLoading = signal(true);
  readonly tickets = signal<Ticket[]>([]);
  readonly ticketTab = signal<TicketTab>('VALID');
  readonly deletingTicketId = signal<string | null>(null);

  constructor(
    private readonly adminService: AdminService,
    private readonly ticketService: TicketService,
    private readonly notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.load();
    this.loadTickets();
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

  setTicketTab(tab: TicketTab): void {
    this.ticketTab.set(tab);
    this.loadTickets();
  }

  loadTickets(): void {
    this.ticketsLoading.set(true);
    this.ticketService.adminList({ status: this.ticketTab() }).subscribe({
      next: (res) => {
        this.tickets.set(res.data ?? []);
        this.ticketsLoading.set(false);
      },
      error: () => this.ticketsLoading.set(false),
    });
  }

  holderName(ticket: Ticket): string {
    if (!ticket.user) return '—';
    return typeof ticket.user === 'string' ? ticket.user : (ticket.user as TicketHolder).fullName;
  }

  deleteTicket(ticket: Ticket): void {
    if (!confirm(`Delete used ticket ${ticket.ticketId}? This cannot be undone.`)) return;

    this.deletingTicketId.set(ticket.ticketId);
    this.ticketService.adminDelete(ticket.ticketId).subscribe({
      next: () => {
        this.deletingTicketId.set(null);
        this.tickets.update((rows) => rows.filter((t) => t.ticketId !== ticket.ticketId));
        this.notify.success('Ticket deleted.');
      },
      error: (err) => {
        this.deletingTicketId.set(null);
        this.notify.error(err.error?.message || 'Could not delete this ticket.');
      },
    });
  }
}
