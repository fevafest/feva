import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizerService } from '../../core/services/organizer.service';
import { NotificationService } from '../../core/services/notification.service';
import { Organizer } from '../../core/models/organizer.model';
import { KesCurrencyPipe } from '../../shared/pipes/kes-currency.pipe';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-admin-organizers',
  standalone: true,
  imports: [CommonModule, KesCurrencyPipe, LoadingSpinnerComponent, EmptyStateComponent],
  templateUrl: './admin-organizers.html',
  styleUrls: ['../admin-table.scss'],
})
export class AdminOrganizersComponent implements OnInit {
  readonly loading = signal(true);
  readonly organizers = signal<Organizer[]>([]);
  readonly filter = signal<'all' | 'pending' | 'approved'>('all');

  constructor(private readonly organizerService: OrganizerService, private readonly notify: NotificationService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const approved = this.filter() === 'all' ? undefined : this.filter() === 'approved';
    this.organizerService.adminList(approved).subscribe({
      next: (res) => {
        this.organizers.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setFilter(value: 'all' | 'pending' | 'approved'): void {
    this.filter.set(value);
    this.load();
  }

  approve(organizer: Organizer): void {
    this.organizerService.approve(organizer._id).subscribe({
      next: () => {
        this.notify.success('Organizer approved.');
        this.load();
      },
      error: (err) => this.notify.error(err.error?.message || 'Could not approve organizer.'),
    });
  }

  userName(organizer: Organizer): string {
    return typeof organizer.user === 'string' ? '' : organizer.user.fullName;
  }

  userEmail(organizer: Organizer): string {
    return typeof organizer.user === 'string' ? '' : organizer.user.email;
  }
}
