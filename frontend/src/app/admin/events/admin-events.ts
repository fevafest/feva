import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EventService } from '../../core/services/event.service';
import { NotificationService } from '../../core/services/notification.service';
import { FevaEvent, EventStatus } from '../../core/models/event.model';
import { FileUrlPipe } from '../../shared/pipes/file-url.pipe';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { IconComponent } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-admin-events',
  standalone: true,
  imports: [CommonModule, RouterLink, FileUrlPipe, LoadingSpinnerComponent, EmptyStateComponent, IconComponent],
  templateUrl: './admin-events.html',
  styleUrl: './admin-events.scss',
})
export class AdminEventsComponent implements OnInit {
  readonly loading = signal(true);
  readonly events = signal<FevaEvent[]>([]);
  readonly filter = signal<EventStatus | 'all'>('all');

  constructor(private readonly eventService: EventService, private readonly notify: NotificationService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.eventService.adminListAll(this.filter() === 'all' ? undefined : this.filter()).subscribe({
      next: (res) => {
        this.events.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setFilter(status: EventStatus | 'all'): void {
    this.filter.set(status);
    this.load();
  }

  publish(event: FevaEvent): void {
    this.eventService.setStatus(event._id, 'published').subscribe({
      next: () => {
        this.notify.success('Event published.');
        this.load();
      },
      error: (err) => this.notify.error(err.error?.message || 'Could not publish event.'),
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

  togglePromoted(event: FevaEvent): void {
    this.eventService.setPromoted(event._id, !event.isPromoted).subscribe({
      next: () => {
        this.notify.success(event.isPromoted ? 'Event unpromoted.' : 'Event promoted — it will flash beside the logo.');
        this.load();
      },
      error: (err) => this.notify.error(err.error?.message || 'Could not update event.'),
    });
  }
}
