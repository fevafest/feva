import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { EventService } from '../../../core/services/event.service';
import { FevaEvent } from '../../../core/models/event.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent implements OnInit, OnDestroy {
  private readonly eventService = inject(EventService);

  readonly menuOpen = signal(false);
  readonly accountMenuOpen = signal(false);

  /** Admin-flagged promoted events, cycled through as a flashing ticker beside the logo. */
  readonly promotedEvents = signal<FevaEvent[]>([]);
  readonly activeIndex = signal(0);
  readonly activePromoted = computed(() => this.promotedEvents()[this.activeIndex()] ?? null);
  private cycleTimer?: ReturnType<typeof setInterval>;

  constructor(readonly auth: AuthService, private readonly router: Router) {}

  ngOnInit(): void {
    this.eventService.list({ promoted: true, limit: 5 }).subscribe({
      next: (res) => {
        const events = res.data ?? [];
        this.promotedEvents.set(events);
        if (events.length > 1) {
          this.cycleTimer = setInterval(() => {
            this.activeIndex.update((i) => (i + 1) % events.length);
          }, 4000);
        }
      },
      error: () => this.promotedEvents.set([]),
    });
  }

  ngOnDestroy(): void {
    if (this.cycleTimer) clearInterval(this.cycleTimer);
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  toggleAccountMenu(): void {
    this.accountMenuOpen.update((v) => !v);
  }

  dashboardLink(): string {
    const role = this.auth.currentUser()?.role;
    if (role === 'admin') return '/admin';
    if (role === 'organizer') return '/organizer';
    if (role === 'affiliate') return '/affiliate';
    return '/dashboard';
  }

  logout(): void {
    this.accountMenuOpen.set(false);
    this.auth.logout();
  }
}
