import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { SettingsService } from '../../core/services/settings.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-settings.html',
  styleUrl: './admin-settings.scss',
})
export class AdminSettingsComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly settingsService = inject(SettingsService);
  private readonly notify = inject(NotificationService);

  readonly savingProfile = signal(false);
  readonly savingPassword = signal(false);
  readonly loadingPlatform = signal(true);
  readonly savingPlatform = signal(false);

  readonly profileForm = this.fb.nonNullable.group({
    fullName: [this.auth.currentUser()?.fullName ?? '', Validators.required],
    phoneNumber: [this.auth.currentUser()?.phoneNumber ?? '', Validators.required],
  });

  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly platformForm = this.fb.nonNullable.group({
    platformFeePercent: [5, [Validators.required, Validators.min(0), Validators.max(100)]],
    platformFeeFixed: [0, [Validators.required, Validators.min(0)]],
    affiliateDefaultCommissionPercent: [10, [Validators.required, Validators.min(0), Validators.max(100)]],
    contactEmail: ['', [Validators.required, Validators.email]],
    contactPhone: ['', Validators.required],
    siteTagline: ['', Validators.required],
  });

  ngOnInit(): void {
    this.settingsService.adminGet().subscribe({
      next: (res) => {
        const s = res.data;
        if (s) {
          this.platformForm.patchValue({
            platformFeePercent: Math.round(s.platformFeePercent * 100 * 100) / 100,
            platformFeeFixed: s.platformFeeFixed,
            affiliateDefaultCommissionPercent: s.affiliateDefaultCommissionPercent,
            contactEmail: s.contactEmail,
            contactPhone: s.contactPhone,
            siteTagline: s.siteTagline,
          });
        }
        this.loadingPlatform.set(false);
      },
      error: () => this.loadingPlatform.set(false),
    });
  }

  savePlatformSettings(): void {
    if (this.platformForm.invalid) {
      this.platformForm.markAllAsTouched();
      return;
    }
    this.savingPlatform.set(true);
    const raw = this.platformForm.getRawValue();

    this.settingsService
      .adminUpdate({
        platformFeePercent: raw.platformFeePercent / 100,
        platformFeeFixed: raw.platformFeeFixed,
        affiliateDefaultCommissionPercent: raw.affiliateDefaultCommissionPercent,
        contactEmail: raw.contactEmail,
        contactPhone: raw.contactPhone,
        siteTagline: raw.siteTagline,
      })
      .subscribe({
        next: () => {
          this.savingPlatform.set(false);
          this.notify.success('Platform settings updated.');
        },
        error: (err) => {
          this.savingPlatform.set(false);
          this.notify.error(err.error?.message || 'Could not update settings.');
        },
      });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.savingProfile.set(true);
    const { fullName, phoneNumber } = this.profileForm.getRawValue();
    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('phoneNumber', phoneNumber);

    this.userService.updateProfile(formData).subscribe({
      next: (res) => {
        this.savingProfile.set(false);
        if (res.data) this.auth.setUser(res.data);
        this.notify.success('Admin profile updated.');
      },
      error: (err) => {
        this.savingProfile.set(false);
        this.notify.error(err.error?.message || 'Could not update profile.');
      },
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.savingPassword.set(true);
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();

    this.userService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.passwordForm.reset();
        this.notify.success('Password changed successfully.');
      },
      error: (err) => {
        this.savingPassword.set(false);
        this.notify.error(err.error?.message || 'Could not change password.');
      },
    });
  }
}
