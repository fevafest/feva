import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * The FEVA TICKETS.EA wordmark — the supplied artwork itself, so every
 * placement matches the brand exactly. The file already carries its own black
 * plate, so it needs no background from the surrounding layout.
 */
@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <img
      class="feva-logo"
      src="logo.png"
      [attr.alt]="label"
      [style.height.px]="height"
      width="1456"
      height="494"
      decoding="async"
    />
  `,
  styles: [
    `
      .feva-logo {
        display: block;
        width: auto;
        max-width: 100%;
        object-fit: contain;
      }
    `,
  ],
})
export class LogoComponent {
  @Input() height = 40;
  @Input() label = 'FEVA TICKETS.EA';
}
