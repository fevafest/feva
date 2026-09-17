import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
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
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly eventService = inject(EventService);
  private readonly router = inject(Router);

  readonly activeTab = signal<SearchTab>('events');
  readonly categories = EVENT_CATEGORIES;

  readonly featuredEvents = signal<FevaEvent[]>([]);
  readonly upcomingEvents = signal<FevaEvent[]>([]);
  readonly loadingFeatured = signal(true);
  readonly loadingUpcoming = signal(true);

  /** Subtle parallax offset for the hero skyline layer, driven by scroll. */
  readonly heroOffset = signal(0);

  readonly searchForm = this.fb.nonNullable.group({
    search: [''],
    city: [''],
  });

  ngOnInit(): void {
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
