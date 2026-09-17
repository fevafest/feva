import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../core/services/event.service';
import { FevaEvent, EVENT_CATEGORIES } from '../../core/models/event.model';
import { EventCardComponent } from '../../shared/components/event-card/event-card';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { IconComponent } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    EventCardComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    IconComponent,
  ],
  templateUrl: './event-list.html',
  styleUrl: './event-list.scss',
})
export class EventListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly eventService = inject(EventService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly categories = EVENT_CATEGORIES;
  readonly events = signal<FevaEvent[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly activeCategory = signal<string | null>(null);

  readonly filterForm = this.fb.nonNullable.group({
    search: [''],
    city: [''],
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.filterForm.patchValue(
        {
          search: params.get('search') ?? '',
          city: params.get('city') ?? '',
        },
        { emitEvent: false }
      );
      this.activeCategory.set(params.get('category'));
      this.page.set(Number(params.get('page')) || 1);
      this.fetchEvents();
    });
  }

  fetchEvents(): void {
    this.loading.set(true);
    const { search, city } = this.filterForm.getRawValue();

    this.eventService
      .list({
        search: search || undefined,
        city: city || undefined,
        category: this.activeCategory() || undefined,
        page: this.page(),
        limit: 12,
      })
      .subscribe({
        next: (res) => {
          this.events.set(res.data ?? []);
          this.totalPages.set(res.meta?.totalPages ?? 1);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  applyFilters(): void {
    this.updateQuery({ page: 1 });
  }

  selectCategory(category: string | null): void {
    this.updateQuery({ category, page: 1 });
  }

  goToPage(newPage: number): void {
    this.updateQuery({ page: newPage });
  }

  private updateQuery(partial: { search?: string; city?: string; category?: string | null; page?: number }): void {
    const { search, city } = this.filterForm.getRawValue();
    const category = partial.category !== undefined ? partial.category : this.activeCategory();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: search || null,
        city: city || null,
        category: category || null,
        page: partial.page ?? 1,
      },
      queryParamsHandling: 'merge',
    });
  }
}
