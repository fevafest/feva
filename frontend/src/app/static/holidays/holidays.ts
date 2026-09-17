import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-holidays',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    <div class="coming-soon-page">
      <div>
        <div class="icon-wrap"><app-icon name="sun" [size]="34" /></div>
        <h1>Holiday Packages Are Coming Soon</h1>
        <p>
          Curated holiday getaways across Kenya's best destinations are on their way. In the
          meantime, discover events happening near you.
        </p>
        <a routerLink="/events" class="btn btn-primary">Browse Events Instead</a>
      </div>
    </div>
  `,
  styleUrl: '../coming-soon.scss',
})
export class HolidaysComponent {}
