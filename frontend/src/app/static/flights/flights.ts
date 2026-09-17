import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-flights',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    <div class="coming-soon-page">
      <div>
        <div class="icon-wrap"><app-icon name="plane" [size]="34" /></div>
        <h1>Flights Are Coming Soon</h1>
        <p>
          We're building a seamless way to search and book flights across Kenya and beyond, right
          alongside your favourite events. Check back soon.
        </p>
        <a routerLink="/events" class="btn btn-primary">Browse Events Instead</a>
      </div>
    </div>
  `,
  styleUrl: '../coming-soon.scss',
})
export class FlightsComponent {}
