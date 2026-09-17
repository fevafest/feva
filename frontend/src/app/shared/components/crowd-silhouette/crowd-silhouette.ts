import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * A flat silhouette of a festival crowd with raised hands — repeatable,
 * poster-art decoration used behind hero copy and as a section divider.
 */
@Component({
  selector: 'app-crowd-silhouette',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg viewBox="0 0 400 80" preserveAspectRatio="none" [attr.fill]="color">
      <g *ngFor="let n of heads">
        <circle [attr.cx]="n.x" [attr.cy]="n.y" r="9" />
        <path
          [attr.d]="
            'M' + (n.x - 13) + ' 80 Q ' + (n.x - 13) + ' ' + (n.y + 6) + ' ' + n.x + ' ' + (n.y + 4) +
            ' Q ' + (n.x + 13) + ' ' + (n.y + 6) + ' ' + (n.x + 13) + ' 80 Z'
          "
        ></path>
        <rect *ngIf="n.arm" [attr.x]="n.x - 2.5" [attr.y]="n.y - 22" width="5" height="20" rx="2.5" />
      </g>
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
export class CrowdSilhouetteComponent {
  @Input() color = 'var(--color-black)';

  readonly heads = Array.from({ length: 22 }, (_, i) => ({
    x: 10 + i * 18,
    y: 45 + ((i * 7) % 13),
    arm: i % 3 === 0,
  }));
}
