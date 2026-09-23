import { Component, HostListener, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { EventService } from '../core/services/event.service';
import { FevaEvent, EVENT_CATEGORIES } from '../core/models/event.model';
import { EventCardComponent } from '../shared/components/event-card/event-card';
import { LoadingSpinnerComponent } from '../shared/components/loading-spinner/loading-spinner';
import { IconComponent } from '../shared/components/icon/icon';
import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';
import { SkylineSilhouetteComponent } from '../shared/components/skyline-silhouette/skyline-silhouette';
import { CrowdSilhouetteComponent } from '../shared/components/crowd-silhouette/crowd-silhouette';
import { FileUrlPipe } from '../shared/pipes/file-url.pipe';
import { LogoComponent } from '../shared/components/logo/logo';

type SearchTab = 'events' | 'flights' | 'holidays';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    EventCardComponent,
    LoadingSpinnerComponent,
    IconComponent,
    ScrollRevealDirective,
    SkylineSilhouetteComponent,
    CrowdSilhouetteComponent,
    FileUrlPipe,
    LogoComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly eventService = inject(EventService);
  private readonly router = inject(Router);

  readonly activeTab = signal<SearchTab>('events');
  readonly categories = EVENT_CATEGORIES;

  readonly featuredEvents = signal<FevaEvent[]>([]);
  readonly upcomingEvents = signal<FevaEvent[]>([]);
  readonly promotedEvents = signal<FevaEvent[]>([]);
  readonly loadingFeatured = signal(true);
  readonly loadingUpcoming = signal(true);

  /** Promoted billboard cycling state. */
  readonly activeBillboardIndex = signal(0);
  readonly activeBillboardEvent = computed(
    () => this.promotedEvents()[this.activeBillboardIndex()] ?? null
  );
  readonly billboardFading = signal(false);

  private billboardTimer?: ReturnType<typeof setInterval>;

  /** Subtle parallax offset for the hero skyline layer, driven by scroll. */
  readonly heroOffset = signal(0);

  readonly searchForm = this.fb.nonNullable.group({
    search: [''],
    city: [''],
  });

  ngOnInit(): void {
    this.eventService.list({ promoted: true, limit: 8 }).subscribe({
      next: (res) => {
        this.promotedEvents.set(res.data ?? []);
        if ((res.data ?? []).length > 1) {
          this.startBillboardCycle();
        }
      },
      error: () => this.promotedEvents.set([]),
    });

    this.eventService.list({ featured: true, limit: 6 }).subscribe({
      next: (res) => {
        this.featuredEvents.set(res.data ?? []);
        this.loadingFeatured.set(false);
      },
      error: () => this.loadingFeatured.set(false),
    });

    this.eventService.list({ limit: 8, sort: 'newest' }).subscribe({
      next: (res) => {
        this.upcomingEvents.set(res.data ?? []);
        this.loadingUpcoming.set(false);
      },
      error: () => this.loadingUpcoming.set(false),
    });
  }

  ngOnDestroy(): void {
    if (this.billboardTimer) clearInterval(this.billboardTimer);
  }

  private startBillboardCycle(): void {
    this.billboardTimer = setInterval(() => {
      this.billboardFading.set(true);
      setTimeout(() => {
        this.activeBillboardIndex.update(
          (i) => (i + 1) % this.promotedEvents().length
        );
        this.billboardFading.set(false);
      }, 450);
    }, 5000);
  }

  goToBillboardSlide(index: number): void {
    if (index === this.activeBillboardIndex()) return;
    if (this.billboardTimer) clearInterval(this.billboardTimer);
    this.billboardFading.set(true);
    setTimeout(() => {
      this.activeBillboardIndex.set(index);
      this.billboardFading.set(false);
      this.startBillboardCycle();
    }, 350);
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.heroOffset.set(Math.min(window.scrollY * 0.25, 120));
  }

  setTab(tab: SearchTab): void {
    this.activeTab.set(tab);
  }

  submitSearch(): void {
    const { search, city } = this.searchForm.getRawValue();
    this.router.navigate(['/events'], {
      queryParams: {
        ...(search ? { search } : {}),
        ...(city ? { city } : {}),
      },
    });
  }

  goToCategory(category: string): void {
    this.router.navigate(['/events'], { queryParams: { category } });
  }
}
