import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { OrganizerService } from '../../core/services/organizer.service';
import { NotificationService } from '../../core/services/notification.service';
import { IconComponent } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-organizer-onboarding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.scss',
})
export class OrganizerOnboardingComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly organizerService = inject(OrganizerService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  readonly submitting = signal(false);
  readonly submitted = signal(false);

  readonly form = this.fb.nonNullable.group({
    businessName: ['', Validators.required],
    description: [''],
    contactEmail: ['', [Validators.email]],
    contactPhone: [''],
    website: [''],
  });

  ngOnInit(): void {
    if (this.auth.currentUser()?.role === 'organizer') {
      this.router.navigateByUrl('/organizer/dashboard');
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const raw = this.form.getRawValue();
    const formData = new FormData();
    Object.entries(raw).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });

    this.organizerService.register(formData).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitted.set(true);
        const user = this.auth.currentUser();
        if (user) {
          const role = ['admin', 'staff'].includes(user.role) ? user.role : 'organizer';
          this.auth.setUser({ ...user, role });
        }
        this.notify.success('Organizer application submitted!');
      },
      error: (err) => {
        this.submitting.set(false);
        this.notify.error(err.error?.message || 'Could not submit application.');
      },
    });
  }
}
