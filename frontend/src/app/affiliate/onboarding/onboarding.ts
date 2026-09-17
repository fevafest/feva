import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AffiliateService } from '../../core/services/affiliate.service';
import { NotificationService } from '../../core/services/notification.service';
import { IconComponent } from '../../shared/components/icon/icon';
import { AffiliateType } from '../../core/models/affiliate.model';

@Component({
  selector: 'app-affiliate-onboarding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.scss',
})
export class AffiliateOnboardingComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly affiliateService = inject(AffiliateService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly createdCode = signal('');

  readonly form = this.fb.nonNullable.group({
    displayName: ['', Validators.required],
    type: ['influencer' as AffiliateType, Validators.required],
    bio: [''],
    instagram: [''],
    tiktok: [''],
    twitter: [''],
    website: [''],
  });

  ngOnInit(): void {
    if (this.auth.currentUser()?.role === 'affiliate') {
      this.router.navigateByUrl('/affiliate/dashboard');
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);

    this.affiliateService.register(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.submitted.set(true);
        this.createdCode.set(res.data?.code ?? '');
        const user = this.auth.currentUser();
        if (user) this.auth.setUser({ ...user, role: 'affiliate' });
        this.notify.success('Affiliate application submitted!');
      },
      error: (err) => {
        this.submitting.set(false);
        this.notify.error(err.error?.message || 'Could not submit application.');
      },
    });
  }
}
