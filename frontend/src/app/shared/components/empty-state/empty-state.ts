import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state">
      <div class="icon-wrap">
        <ng-content select="[icon]"></ng-content>
      </div>
      <h3>{{ title }}</h3>
      <p *ngIf="message">{{ message }}</p>
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      .empty-state {
        text-align: center;
        padding: 60px 20px;
        color: var(--color-gray);
      }
      .icon-wrap {
        width: 64px;
        height: 64px;
        margin: 0 auto 16px;
        border-radius: 50%;
        background: var(--color-light-gray);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-gray);
      }
      h3 {
        color: var(--color-black);
        font-size: 1.1rem;
        margin-bottom: 6px;
      }
      p {
        font-size: 0.9rem;
        max-width: 340px;
        margin: 0 auto 16px;
      }
    `,
  ],
})
export class EmptyStateComponent {
  @Input() title = 'Nothing here yet';
  @Input() message = '';
}
