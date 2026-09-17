import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {
  readonly menuOpen = signal(false);
  readonly accountMenuOpen = signal(false);

  constructor(readonly auth: AuthService, private readonly router: Router) {}

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  toggleAccountMenu(): void {
    this.accountMenuOpen.update((v) => !v);
  }

  dashboardLink(): string {
    const role = this.auth.currentUser()?.role;
    if (role === 'admin') return '/admin';
    if (role === 'organizer') return '/organizer';
    return '/dashboard';
  }

  logout(): void {
    this.accountMenuOpen.set(false);
    this.auth.logout();
  }
}
