import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { IconComponent } from '../../shared/components/icon/icon';
import { LogoComponent } from '../../shared/components/logo/logo';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent, LogoComponent],
  templateUrl: './login.html',
  styleUrl: '../auth.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notify = inject(NotificationService);

  readonly loading = signal(false);
  readonly showPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    identifier: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    const { identifier, password } = this.form.getRawValue();

    this.auth.login(identifier, password).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.notify.success(res.message || 'Logged in successfully.');
        const redirect = this.route.snapshot.queryParamMap.get('redirect');
        this.router.navigateByUrl(redirect || this.landingPath());
      },
      error: (err) => {
        this.loading.set(false);
        this.notify.error(err.error?.message || 'Login failed. Please try again.');
      },
    });
  }

  private landingPath(): string {
    const role = this.auth.currentUser()?.role;
    if (role === 'admin') return '/admin';
    if (role === 'organizer') return '/organizer';
    if (role === 'affiliate') return '/affiliate';
    return '/dashboard';
  }
}
