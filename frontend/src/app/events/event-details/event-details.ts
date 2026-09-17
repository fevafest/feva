import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventService } from '../../core/services/event.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { CheckoutStateService, SelectedTicket } from '../../core/services/checkout-state.service';
import { FevaEvent } from '../../core/models/event.model';
import { KesCurrencyPipe } from '../../shared/pipes/kes-currency.pipe';
import { FileUrlPipe } from '../../shared/pipes/file-url.pipe';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { IconComponent } from '../../shared/components/icon/icon';

const PLATFORM_FEE_PERCENT = 0.05;

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [CommonModule, RouterLink, KesCurrencyPipe, FileUrlPipe, LoadingSpinnerComponent, IconComponent],
  templateUrl: './event-details.html',
  styleUrl: './event-details.scss',
})
export class EventDetailsComponent implements OnInit {
  readonly event = signal<FevaEvent | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly quantities = signal<Record<string, number>>({});

  readonly subtotal = computed(() => {
    const ev = this.event();
    const qty = this.quantities();
    if (!ev) return 0;
    return ev.ticketTypes.reduce((sum, t) => sum + t.price * (qty[t._id] ?? 0), 0);
  });

  readonly fees = computed(() => Math.round(this.subtotal() * PLATFORM_FEE_PERCENT));
  readonly total = computed(() => this.subtotal() + this.fees());
  readonly totalQuantity = computed(() =>
    Object.values(this.quantities()).reduce((sum, q) => sum + q, 0)
  );

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly eventService: EventService,
    readonly auth: AuthService,
    private readonly checkoutState: CheckoutStateService,
    private readonly notify: NotificationService
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.eventService.getBySlug(slug).subscribe({
      next: (res) => {
        this.event.set(res.data ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  remaining(ticketTypeId: string): number {
    const ticketType = this.event()?.ticketTypes.find((t) => t._id === ticketTypeId);
    if (!ticketType) return 0;
    return Math.max(ticketType.quantityTotal - ticketType.quantitySold, 0);
  }

  updateQuantity(ticketTypeId: string, delta: number): void {
    const max = this.remaining(ticketTypeId);
    this.quantities.update((current) => {
      const next = Math.min(Math.max((current[ticketTypeId] ?? 0) + delta, 0), max);
      return { ...current, [ticketTypeId]: next };
    });
  }

  dateLabel(): string {
    const ev = this.event();
    if (!ev) return '';
    return new Date(ev.startDate).toLocaleDateString('en-KE', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  proceedToCheckout(): void {
    const ev = this.event();
    if (!ev) return;

    if (this.totalQuantity() === 0) {
      this.notify.error('Select at least one ticket to continue.');
      return;
    }

    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { redirect: `/events/${ev.slug}` },
      });
      this.notify.info('Please log in to continue with your purchase.');
      return;
    }

    const qty = this.quantities();
    const items: SelectedTicket[] = ev.ticketTypes
      .filter((t) => (qty[t._id] ?? 0) > 0)
      .map((t) => ({
        ticketTypeId: t._id,
        ticketTypeName: t.name,
        unitPrice: t.price,
        quantity: qty[t._id],
      }));

    this.checkoutState.setSelection({ event: ev, items });
    this.router.navigate(['/events', ev.slug, 'checkout']);
  }
}
