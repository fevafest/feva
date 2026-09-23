import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SettingsService } from '../../../core/services/settings.service';
import { PublicSettings } from '../../../core/models/settings.model';
import { LogoComponent } from '../logo/logo';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, LogoComponent],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class FooterComponent implements OnInit {
  private readonly settingsService = inject(SettingsService);

  readonly year = new Date().getFullYear();
  readonly settings = signal<PublicSettings | null>(null);

  ngOnInit(): void {
    this.settingsService.getPublic().subscribe({
      next: (res) => this.settings.set(res.data ?? null),
      error: () => this.settings.set(null),
    });
  }
}
