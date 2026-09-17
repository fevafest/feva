import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AffiliateTrackingService } from './core/services/affiliate-tracking.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App {
  private readonly affiliateTracking = inject(AffiliateTrackingService);

  constructor() {
    this.affiliateTracking.init();
  }
}
