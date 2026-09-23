import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { IconComponent } from '../../shared/components/icon/icon';
import { LogoComponent } from '../../shared/components/logo/logo';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent, LogoComponent],
  templateUrl: './reset-password.html',
  styleUrl: '../auth.scss',
})
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notify = inject(NotificationService);

  readonly loading = signal(false);
  readonly showPassword = signal(false);
  private readonly token = this.route.snapshot.paramMap.get('token') ?? '';

  readonly form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { password, confirmPassword } = this.form.getRawValue();
    if (password !== confirmPassword) {
      this.notify.error('Passwords do not match.');
      return;
    }

    this.loading.set(true);
    this.auth.resetPassword(this.token, password).subscribe({
      next: () => {
        this.loading.set(false);
        this.notify.success('Password reset successfully. You are now logged in.');
        this.router.navigateByUrl('/dashboard');
      },
      error: (err) => {
        this.loading.set(false);
        this.notify.error(err.error?.message || 'Reset link is invalid or has expired.');
      },
    });
  }
}
