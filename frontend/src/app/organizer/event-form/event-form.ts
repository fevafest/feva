import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventService } from '../../core/services/event.service';
import { NotificationService } from '../../core/services/notification.service';
import { EVENT_CATEGORIES } from '../../core/models/event.model';
import { FileUrlPipe } from '../../shared/pipes/file-url.pipe';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { IconComponent } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FileUrlPipe, LoadingSpinnerComponent, IconComponent],
  templateUrl: './event-form.html',
  styleUrl: './event-form.scss',
})
export class EventFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly eventService = inject(EventService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  readonly categories = EVENT_CATEGORIES;
  readonly isEditMode = signal(false);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly posterFile = signal<File | null>(null);
  readonly posterPreview = signal<string | null>(null);
  private eventId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    category: ['Music', Validators.required],
    description: ['', Validators.required],
    venue: ['', Validators.required],
    location: ['', Validators.required],
    address: [''],
    startDate: ['', Validators.required],
    startTime: ['', Validators.required],
    endTime: [''],
    ticketTypes: this.fb.array([this.buildTicketTypeGroup()]),
  });

  get ticketTypes(): FormArray {
    return this.form.get('ticketTypes') as FormArray;
  }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('id');
    if (this.eventId) {
      this.isEditMode.set(true);
      this.loadEvent(this.eventId);
    }
  }

  private buildTicketTypeGroup(existing?: { name: string; price: number; quantityTotal: number; description?: string; _id?: string }) {
    return this.fb.group({
      _id: [existing?._id ?? ''],
      name: [existing?.name ?? '', Validators.required],
      price: [existing?.price ?? 0, [Validators.required, Validators.min(0)]],
      quantityTotal: [existing?.quantityTotal ?? 0, [Validators.required, Validators.min(1)]],
      description: [existing?.description ?? ''],
    });
  }

  addTicketType(): void {
    this.ticketTypes.push(this.buildTicketTypeGroup());
  }

  removeTicketType(index: number): void {
    if (this.ticketTypes.length <= 1) return;
    this.ticketTypes.removeAt(index);
  }

  onPosterSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.posterFile.set(file);
    const reader = new FileReader();
    reader.onload = () => this.posterPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  private loadEvent(id: string): void {
    this.loading.set(true);
    this.eventService.getById(id).subscribe({
      next: (res) => {
        const ev = res.data;
        if (!ev) {
          this.notify.error('Event not found.');
          this.router.navigateByUrl(this.backPath());
          return;
        }
        this.form.patchValue({
          title: ev.title,
          category: ev.category,
          description: ev.description,
          venue: ev.venue,
          location: ev.location,
          address: ev.address ?? '',
          startDate: ev.startDate.slice(0, 10),
          startTime: ev.startTime,
          endTime: ev.endTime ?? '',
        });
        this.ticketTypes.clear();
        ev.ticketTypes.forEach((t) => this.ticketTypes.push(this.buildTicketTypeGroup(t)));
        this.posterPreview.set(ev.posterImage);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.notify.error(err.error?.message || 'Could not load event.');
        this.router.navigateByUrl(this.backPath());
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notify.error('Please complete all required fields.');
      return;
    }

    this.submitting.set(true);
    const raw = this.form.getRawValue();
    const formData = new FormData();
    formData.append('title', raw.title);
    formData.append('category', raw.category);
    formData.append('description', raw.description);
    formData.append('venue', raw.venue);
    formData.append('location', raw.location);
    formData.append('address', raw.address ?? '');
    formData.append('startDate', raw.startDate);
    formData.append('startTime', raw.startTime);
    formData.append('endTime', raw.endTime ?? '');
    formData.append(
      'ticketTypes',
      JSON.stringify(
        raw.ticketTypes.map((t) => ({
          ...(t._id ? { _id: t._id } : {}),
          name: t.name,
          price: t.price,
          quantityTotal: t.quantityTotal,
          description: t.description,
        }))
      )
    );
    if (this.posterFile()) formData.append('poster', this.posterFile()!);
    else if (!this.isEditMode()) formData.append('posterImage', 'https://picsum.photos/seed/new-event/900/600');

    const request$ = this.isEditMode()
      ? this.eventService.update(this.eventId!, formData)
      : this.eventService.create(formData);

    request$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.notify.success(this.isEditMode() ? 'Event updated successfully.' : 'Event created successfully.');
        this.router.navigateByUrl(this.backPath());
      },
      error: (err) => {
        this.submitting.set(false);
        this.notify.error(err.error?.message || 'Could not save event.');
      },
    });
  }

  backPath(): string {
    return this.router.url.startsWith('/admin') ? '/admin/events' : '/organizer/dashboard';
  }
}
