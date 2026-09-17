import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { Order, EventSummary } from '../../core/models/order.model';
import { KesCurrencyPipe } from '../../shared/pipes/kes-currency.pipe';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { IconComponent } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule, RouterLink, KesCurrencyPipe, LoadingSpinnerComponent, IconComponent],
  templateUrl: './order-success.html',
  styleUrl: './order-success.scss',
})
export class OrderSuccessComponent implements OnInit {
  readonly order = signal<Order | null>(null);
  readonly loading = signal(true);
  readonly notPaid = signal(false);

  constructor(private readonly route: ActivatedRoute, private readonly orderService: OrderService) {}

  ngOnInit(): void {
    const reference = this.route.snapshot.paramMap.get('reference')!;
    this.orderService.getByReference(reference).subscribe({
      next: (res) => {
        const order = res.data ?? null;
        this.order.set(order);
        this.notPaid.set(order?.paymentStatus !== 'PAID');
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  eventTitle(order: Order): string {
    return typeof order.event === 'string' ? '' : (order.event as EventSummary).title;
  }
}
