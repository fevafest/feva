import { Component, Input } from '@angular/core';

/**
 * Flat Nairobi-style skyline silhouette (a nod to the KICC tower among
 * generic office blocks), used as a poster-art decoration rather than a
 * photograph — keeps the hero art-directed and dependency-free.
 */
@Component({
  selector: 'app-skyline-silhouette',
  standalone: true,
  template: `
    <svg viewBox="0 0 1200 220" preserveAspectRatio="none" [attr.fill]="color">
      <rect x="0" y="120" width="70" height="100" />
      <rect x="60" y="90" width="55" height="130" />
      <rect x="110" y="140" width="50" height="80" />
      <rect x="155" y="60" width="60" height="160" />
      <rect x="210" y="100" width="45" height="120" />
      <!-- KICC-style tower: tapered shaft + conical top -->
      <path d="M270 220 L285 40 L300 20 L315 40 L330 220 Z" />
      <rect x="345" y="70" width="55" height="150" />
      <rect x="405" y="110" width="40" height="110" />
      <rect x="450" y="50" width="65" height="170" />
      <rect x="520" y="130" width="50" height="90" />
      <rect x="575" y="85" width="45" height="135" />
      <rect x="625" y="150" width="60" height="70" />
      <rect x="690" y="65" width="50" height="155" />
      <rect x="745" y="115" width="45" height="105" />
      <rect x="795" y="45" width="60" height="175" />
      <rect x="860" y="125" width="55" height="95" />
      <rect x="920" y="95" width="40" height="125" />
      <rect x="965" y="150" width="65" height="70" />
      <rect x="1035" y="75" width="50" height="145" />
      <rect x="1090" y="135" width="45" height="85" />
      <rect x="1140" y="100" width="60" height="120" />
    </svg>
  `,
  styles: [
    `
      :host {
        display: block;
        line-height: 0;
      }
      svg {
        width: 100%;
        height: 100%;
        display: block;
      }
    `,
  ],
})
export class SkylineSilhouetteComponent {
  @Input() color = 'var(--color-black)';
}
