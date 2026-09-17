import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EventService } from '../../core/services/event.service';
import { OrganizerService, OrganizerStats } from '../../core/services/organizer.service';
import { NotificationService } from '../../core/services/notification.service';
import { FevaEvent } from '../../core/models/event.model';
import { KesCurrencyPipe } from '../../shared/pipes/kes-currency.pipe';
import { FileUrlPipe } from '../../shared/pipes/file-url.pipe';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { IconComponent } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-organizer-my-events',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    KesCurrencyPipe,
    FileUrlPipe,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    IconComponent,
  ],
  templateUrl: './my-events.html',
  styleUrl: './my-events.scss',
})
export class OrganizerMyEventsComponent implements OnInit {
  readonly loading = signal(true);
  readonly events = signal<FevaEvent[]>([]);
  readonly stats = signal<OrganizerStats | null>(null);

  constructor(
    private readonly eventService: EventService,
    private readonly organizerService: OrganizerService,
    private readonly notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.eventService.myEvents().subscribe({
      next: (res) => {
        this.events.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.organizerService.myStats().subscribe({
      next: (res) => this.stats.set(res.data ?? null),
    });
  }

  submitForApproval(event: FevaEvent): void {
    this.eventService.setStatus(event._id, 'pending_approval').subscribe({
      next: () => {
        this.notify.success('Submitted for admin approval.');
        this.load();
      },
      error: (err) => this.notify.error(err.error?.message || 'Could not update event.'),
    });
  }

  unpublish(event: FevaEvent): void {
    this.eventService.setStatus(event._id, 'unpublished').subscribe({
      next: () => {
        this.notify.success('Event unpublished.');
        this.load();
      },
      error: (err) => this.notify.error(err.error?.message || 'Could not update event.'),
    });
  }

  remove(event: FevaEvent): void {
    if (!confirm(`Delete "${event.title}"? This cannot be undone.`)) return;
    this.eventService.remove(event._id).subscribe({
      next: () => {
        this.notify.success('Event deleted.');
        this.load();
      },
      error: (err) => this.notify.error(err.error?.message || 'Could not delete event.'),
    });
  }
}
