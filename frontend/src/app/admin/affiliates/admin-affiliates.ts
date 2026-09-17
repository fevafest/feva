import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AffiliateService } from '../../core/services/affiliate.service';
import { EventService } from '../../core/services/event.service';
import { NotificationService } from '../../core/services/notification.service';
import { Affiliate, AffiliateEventRate } from '../../core/models/affiliate.model';
import { FevaEvent } from '../../core/models/event.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { IconComponent } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-admin-affiliates',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent, EmptyStateComponent, IconComponent],
  templateUrl: './admin-affiliates.html',
  styleUrls: ['../admin-table.scss', './admin-affiliates.scss'],
})
export class AdminAffiliatesComponent implements OnInit {
  private readonly affiliateService = inject(AffiliateService);
  private readonly eventService = inject(EventService);
  private readonly notify = inject(NotificationService);

  readonly loading = signal(true);
  readonly affiliates = signal<Affiliate[]>([]);
  readonly filter = signal<'all' | 'pending' | 'approved'>('all');
  readonly rateEdits = signal<Record<string, number>>({});

  readonly expandedId = signal<string | null>(null);
  readonly eventRates = signal<AffiliateEventRate[]>([]);
  readonly events = signal<FevaEvent[]>([]);
  readonly newRateEventId = signal('');
  readonly newRatePercent = signal(10);

  ngOnInit(): void {
    this.load();
    this.eventService.adminListAll().subscribe({ next: (res) => this.events.set(res.data ?? []) });
  }

  load(): void {
    this.loading.set(true);
    const approved = this.filter() === 'all' ? undefined : this.filter() === 'approved';
    this.affiliateService.adminList(approved).subscribe({
      next: (res) => {
        this.affiliates.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setFilter(value: 'all' | 'pending' | 'approved'): void {
    this.filter.set(value);
    this.load();
  }

  userName(a: Affiliate): string {
    return typeof a.user === 'string' ? '' : a.user.fullName;
  }

  userEmail(a: Affiliate): string {
    return typeof a.user === 'string' ? '' : a.user.email;
  }

  rateValue(a: Affiliate): number {
    return this.rateEdits()[a._id] ?? a.defaultCommissionPercent;
  }

  setRateValue(a: Affiliate, value: number): void {
    this.rateEdits.update((map) => ({ ...map, [a._id]: value }));
  }

  approve(affiliate: Affiliate): void {
    this.affiliateService.adminApprove(affiliate._id).subscribe({
      next: () => {
        this.notify.success('Affiliate approved.');
        this.load();
      },
      error: (err) => this.notify.error(err.error?.message || 'Could not approve affiliate.'),
    });
  }

  toggleActive(affiliate: Affiliate): void {
    this.affiliateService.adminSetActive(affiliate._id, !affiliate.isActive).subscribe({
      next: () => {
        this.notify.success(affiliate.isActive ? 'Affiliate deactivated.' : 'Affiliate activated.');
        this.load();
      },
      error: (err) => this.notify.error(err.error?.message || 'Could not update affiliate.'),
    });
  }

  saveDefaultRate(affiliate: Affiliate): void {
    const value = this.rateValue(affiliate);
    this.affiliateService.adminSetDefaultRate(affiliate._id, value).subscribe({
      next: () => this.notify.success('Default commission rate updated.'),
      error: (err) => this.notify.error(err.error?.message || 'Could not update rate.'),
    });
  }

  toggleEventRates(affiliate: Affiliate): void {
    if (this.expandedId() === affiliate._id) {
      this.expandedId.set(null);
      return;
    }
    this.expandedId.set(affiliate._id);
    this.newRateEventId.set('');
    this.newRatePercent.set(affiliate.defaultCommissionPercent);
    this.affiliateService.adminListEventRates(affiliate._id).subscribe({
      next: (res) => this.eventRates.set(res.data ?? []),
    });
  }

  eventTitle(rate: AffiliateEventRate): string {
    return typeof rate.event === 'string' ? '' : rate.event.title;
  }

  addEventRate(affiliate: Affiliate): void {
    const eventId = this.newRateEventId();
    const percent = this.newRatePercent();
    if (!eventId) {
      this.notify.error('Select an event first.');
      return;
    }
    this.affiliateService.adminSetEventRate(affiliate._id, eventId, percent).subscribe({
      next: () => {
        this.notify.success('Event commission rate saved.');
        this.newRateEventId.set('');
        this.affiliateService.adminListEventRates(affiliate._id).subscribe({
          next: (res) => this.eventRates.set(res.data ?? []),
        });
      },
      error: (err) => this.notify.error(err.error?.message || 'Could not save event rate.'),
    });
  }

  removeEventRate(affiliate: Affiliate, rate: AffiliateEventRate): void {
    const eventId = typeof rate.event === 'string' ? rate.event : rate.event._id;
    this.affiliateService.adminRemoveEventRate(affiliate._id, eventId).subscribe({
      next: () => {
        this.notify.success('Event rate removed.');
        this.eventRates.update((list) => list.filter((r) => r._id !== rate._id));
      },
      error: (err) => this.notify.error(err.error?.message || 'Could not remove event rate.'),
    });
  }
}
