import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * FEVA TICKETS.EA wordmark. Drawn as SVG rather than shipped as a bitmap so it
 * stays sharp at any size, and inherits `currentColor` so the same component
 * works on the dark header and on light surfaces.
 */
@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      class="feva-logo"
      [attr.height]="height"
      viewBox="0 0 320 132"
      role="img"
      [attr.aria-label]="label"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <path id="fevaArc" d="M 14 94 Q 160 50 306 94" fill="none" />
        <path id="ticketsArc" d="M 62 126 Q 160 108 258 126" fill="none" />
      </defs>

      <text class="feva-word" text-anchor="middle">
        <textPath href="#fevaArc" startOffset="50%">FEVA</textPath>
      </text>

      <text class="feva-sub" text-anchor="middle">
        <textPath href="#ticketsArc" startOffset="50%">TICKETS.EA</textPath>
      </text>
    </svg>
  `,
  styles: [
    `
      .feva-logo {
        display: block;
        width: auto;
        overflow: visible;
      }

      .feva-word {
        font-family: var(--font-display), 'Anton', sans-serif;
        font-size: 78px;
        letter-spacing: 1px;
      }

      .feva-sub {
        font-family: var(--font-display), 'Anton', sans-serif;
        font-size: 25px;
        letter-spacing: 3px;
      }
    `,
  ],
})
export class LogoComponent {
  @Input() height = 40;
  @Input() label = 'FEVA Tickets EA';
}
