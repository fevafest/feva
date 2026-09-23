import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TicketService } from '../../core/services/ticket.service';
import { Ticket } from '../../core/models/ticket.model';
import { KesCurrencyPipe } from '../../shared/pipes/kes-currency.pipe';
import { FileUrlPipe } from '../../shared/pipes/file-url.pipe';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { IconComponent } from '../../shared/components/icon/icon';
import { LogoComponent } from '../../shared/components/logo/logo';

@Component({
  selector: 'app-my-tickets',
  standalone: true,
  imports: [CommonModule, RouterLink, KesCurrencyPipe, FileUrlPipe, LoadingSpinnerComponent, EmptyStateComponent, IconComponent, LogoComponent],
  templateUrl: './my-tickets.html',
  styleUrl: './my-tickets.scss',
})
export class MyTicketsComponent implements OnInit {
  readonly loading = signal(true);
  readonly tickets = signal<Ticket[]>([]);
  readonly activeTicket = signal<Ticket | null>(null);

  constructor(private readonly ticketService: TicketService) {}

  ngOnInit(): void {
    this.ticketService.myTickets().subscribe({
      next: (res) => {
        this.tickets.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openTicket(ticket: Ticket): void {
    this.activeTicket.set(ticket);
  }

  closeTicket(): void {
    this.activeTicket.set(null);
  }
}
