import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FevaEvent } from '../../../core/models/event.model';
import { KesCurrencyPipe } from '../../pipes/kes-currency.pipe';
import { FileUrlPipe } from '../../pipes/file-url.pipe';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule, RouterLink, KesCurrencyPipe, FileUrlPipe],
  templateUrl: './event-card.html',
  styleUrl: './event-card.scss',
})
export class EventCardComponent {
  @Input({ required: true }) event!: FevaEvent;

  get isFree(): boolean {
    return !this.event.minPrice || this.event.minPrice === 0;
  }

  get dateLabel(): string {
    const d = new Date(this.event.startDate);
    return d.toLocaleDateString('en-KE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  }
}
