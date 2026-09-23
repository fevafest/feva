import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { IconComponent } from '../../shared/components/icon/icon';
import { LogoComponent } from '../../shared/components/logo/logo';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent, LogoComponent],
  templateUrl: './register.html',
  styleUrl: '../auth.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  readonly loading = signal(false);
  readonly showPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^0[71]\d{8}$/)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);

    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.notify.success('Account created. Welcome to FEVA FEST!');
        this.router.navigateByUrl('/dashboard');
      },
      error: (err) => {
        this.loading.set(false);
        this.notify.error(err.error?.message || 'Registration failed. Please try again.');
      },
    });
  }
}
