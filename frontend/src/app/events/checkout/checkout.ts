import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { interval, Subscription, switchMap, takeWhile } from 'rxjs';
import { CheckoutStateService, CheckoutSelection } from '../../core/services/checkout-state.service';
import { OrderService } from '../../core/services/order.service';
import { PaymentService } from '../../core/services/payment.service';
import { NotificationService } from '../../core/services/notification.service';
import { AffiliateTrackingService } from '../../core/services/affiliate-tracking.service';
import { Order } from '../../core/models/order.model';
import { KesCurrencyPipe } from '../../shared/pipes/kes-currency.pipe';
import { FileUrlPipe } from '../../shared/pipes/file-url.pipe';
import { IconComponent } from '../../shared/components/icon/icon';

type CheckoutStep = 'summary' | 'awaiting-payment' | 'success' | 'failed';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, KesCurrencyPipe, FileUrlPipe, IconComponent],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly checkoutState = inject(CheckoutStateService);
  private readonly orderService = inject(OrderService);
  private readonly paymentService = inject(PaymentService);
  private readonly notify = inject(NotificationService);
  private readonly affiliateTracking = inject(AffiliateTrackingService);

  selection: CheckoutSelection | null = null;
  readonly step = signal<CheckoutStep>('summary');
  readonly submitting = signal(false);
  readonly order = signal<Order | null>(null);
  readonly failureReason = signal('');
  private pollSub?: Subscription;

  readonly phoneForm = this.fb.nonNullable.group({
    phoneNumber: ['', [Validators.required, Validators.pattern(/^0[71]\d{8}$/)]],
  });

  ngOnInit(): void {
    this.selection = this.checkoutState.selection();
    if (!this.selection) {
      const slug = this.route.snapshot.paramMap.get('slug');
      this.notify.error('Your ticket selection was lost. Please select tickets again.');
      this.router.navigate(slug ? ['/events', slug] : ['/events']);
    }
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  get subtotal(): number {
    return this.selection?.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0) ?? 0;
  }

  get totalQuantity(): number {
    return this.selection?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
  }

  payWithMpesa(): void {
    if (this.phoneForm.invalid || !this.selection) {
      this.phoneForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const { phoneNumber } = this.phoneForm.getRawValue();

    this.orderService
      .create({
        eventId: this.selection.event._id,
        items: this.selection.items.map((i) => ({ ticketTypeId: i.ticketTypeId, quantity: i.quantity })),
        phoneNumber,
        affiliateCode: this.affiliateTracking.getStoredCode() ?? undefined,
      })
      .subscribe({
        next: (orderRes) => {
          const createdOrder = orderRes.data!;
          this.order.set(createdOrder);

          this.paymentService.initiate(createdOrder.paymentReference).subscribe({
            next: () => {
              this.submitting.set(false);
              this.step.set('awaiting-payment');
              this.startPolling(createdOrder.paymentReference);
            },
            error: (err) => {
              this.submitting.set(false);
              this.step.set('failed');
              this.failureReason.set(
                err.error?.message || 'Could not start the M-Pesa payment. Please try again.'
              );
            },
          });
        },
        error: (err) => {
          this.submitting.set(false);
          this.notify.error(err.error?.message || 'Could not create your order. Please try again.');
        },
      });
  }

  private startPolling(reference: string): void {
    this.pollSub = interval(3500)
      .pipe(
        switchMap(() => this.paymentService.getStatus(reference)),
        takeWhile((res) => {
          const status = res.data?.paymentStatus;
          return status === 'PENDING' || status === 'PAYMENT_PENDING';
        }, true)
      )
      .subscribe({
        next: (res) => {
          const status = res.data?.paymentStatus;
          if (status === 'PAID') {
            this.checkoutState.clear();
            this.router.navigate(['/orders', reference, 'success']);
          } else if (status === 'FAILED' || status === 'CANCELLED') {
            this.step.set('failed');
            this.failureReason.set('Your M-Pesa payment was not completed or was cancelled.');
          }
        },
        error: () => {
          this.step.set('failed');
          this.failureReason.set('We lost track of your payment status. Check My Orders shortly.');
        },
      });
  }

  retry(): void {
    this.step.set('summary');
    this.failureReason.set('');
  }
}
