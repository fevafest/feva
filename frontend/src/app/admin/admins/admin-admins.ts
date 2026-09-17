import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { User } from '../../core/models/user.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-admin-admins',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent],
  templateUrl: './admin-admins.html',
  styleUrls: ['../admin-table.scss', './admin-admins.scss'],
})
export class AdminAdminsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly admins = signal<User[]>([]);
  readonly showForm = signal(false);

  readonly form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^0[71]\d{8}$/)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    isSuperAdmin: [false],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.adminService.listAdmins().subscribe({
      next: (res) => {
        this.admins.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.adminService.createAdmin(this.form.getRawValue()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.notify.success('Admin account created.');
        this.form.reset({ isSuperAdmin: false });
        this.showForm.set(false);
        this.load();
      },
      error: (err) => {
        this.submitting.set(false);
        this.notify.error(err.error?.message || 'Could not create admin account.');
      },
    });
  }

  toggleSuperAdmin(admin: User): void {
    const next = !admin.isSuperAdmin;
    if (admin._id === this.auth.currentUser()?._id && !next) {
      this.notify.error('You cannot remove your own superadmin access.');
      return;
    }
    this.adminService.setSuperAdminStatus(admin._id, next).subscribe({
      next: () => {
        this.notify.success(next ? 'Superadmin access granted.' : 'Superadmin access revoked.');
        this.load();
      },
      error: (err) => this.notify.error(err.error?.message || 'Could not update admin.'),
    });
  }
}
