import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../core/services/ticket.service';
import { Ticket, TicketStatus, TicketHolder } from '../../core/models/ticket.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-admin-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent, EmptyStateComponent],
  templateUrl: './admin-tickets.html',
  styleUrls: ['../admin-table.scss'],
})
export class AdminTicketsComponent implements OnInit {
  readonly loading = signal(true);
  readonly tickets = signal<Ticket[]>([]);
  readonly filter = signal<TicketStatus | 'all'>('all');
  readonly search = signal('');

  constructor(private readonly ticketService: TicketService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.ticketService
      .adminList({ status: this.filter() === 'all' ? undefined : this.filter(), search: this.search() || undefined })
      .subscribe({
        next: (res) => {
          this.tickets.set(res.data ?? []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  setFilter(status: TicketStatus | 'all'): void {
    this.filter.set(status);
    this.load();
  }

  holderName(ticket: Ticket): string {
    return typeof ticket.user === 'string' ? ticket.user : (ticket.user as TicketHolder).fullName;
  }
}
