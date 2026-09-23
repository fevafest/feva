import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Glyph {
  char: string;
  x: number;
  y: number;
  angle: number;
}

const VIEW_W = 320;
const VIEW_H = 132;

/**
 * Lays a word out along a shallow upward arc, one glyph at a time.
 *
 * Positioning each letter explicitly rather than using <textPath> keeps the
 * result identical across browsers — textPath spacing and textLength support
 * vary, and iOS Safari in particular renders it inconsistently.
 */
function arcWord(
  text: string,
  { centerX, baselineY, spacing, arcDepth, maxTilt }: {
    centerX: number;
    baselineY: number;
    spacing: number;
    arcDepth: number;
    maxTilt: number;
  }
): Glyph[] {
  const chars = [...text];
  const mid = (chars.length - 1) / 2;
  const edge = mid || 1;

  return chars.map((char, i) => {
    const t = i - mid;
    const ratio = t / edge;
    return {
      char,
      x: centerX + t * spacing,
      // Ends sit lower than the middle, so the word domes upward.
      y: baselineY + arcDepth * ratio * ratio,
      angle: maxTilt * ratio,
    };
  });
}

/**
 * FEVA TICKETS.EA wordmark: white lettering on a solid black block, drawn as
 * SVG so it stays sharp at any size. The letters are horizontally stretched
 * because the mark uses wide blocky caps, while Anton is a condensed face.
 */
@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      class="feva-logo"
      [attr.height]="height"
      [attr.viewBox]="'0 0 ' + viewW + ' ' + viewH"
      role="img"
      [attr.aria-label]="label"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect *ngIf="background" x="0" y="0" [attr.width]="viewW" [attr.height]="viewH" [attr.fill]="backgroundColor" />

      <g [attr.fill]="color">
        <text
          *ngFor="let g of wordGlyphs()"
          class="feva-word"
          text-anchor="middle"
          [attr.transform]="'translate(' + g.x + ' ' + g.y + ') rotate(' + g.angle + ') scale(1.42 1)'"
        >
          {{ g.char }}
        </text>

        <text
          *ngFor="let g of subGlyphs()"
          class="feva-sub"
          text-anchor="middle"
          [attr.transform]="'translate(' + g.x + ' ' + g.y + ') rotate(' + g.angle + ') scale(1.28 1)'"
        >
          {{ g.char }}
        </text>
      </g>
    </svg>
  `,
  styles: [
    `
      .feva-logo {
        display: block;
        width: auto;
      }

      .feva-word {
        font-family: var(--font-display), 'Anton', 'Arial Black', sans-serif;
        font-size: 116px;
      }

      .feva-sub {
        font-family: var(--font-display), 'Anton', 'Arial Black', sans-serif;
        font-size: 21px;
      }
    `,
  ],
})
export class LogoComponent {
  @Input() height = 40;
  @Input() label = 'FEVA Tickets EA';
  /** Draw the black plate behind the lettering. */
  @Input() background = true;
  @Input() backgroundColor = '#000000';
  @Input() color = '#ffffff';

  readonly viewW = VIEW_W;
  readonly viewH = VIEW_H;

  private readonly word = signal('FEVA');
  private readonly sub = signal('TICKETS.EA');

  readonly wordGlyphs = computed(() =>
    arcWord(this.word(), { centerX: 160, baselineY: 96, spacing: 73, arcDepth: 16, maxTilt: 9 })
  );

  // Small, and tucked into the gap the outer letters leave at the bottom.
  readonly subGlyphs = computed(() =>
    arcWord(this.sub(), { centerX: 159, baselineY: 118, spacing: 11.6, arcDepth: 2.5, maxTilt: 2 })
  );
}
