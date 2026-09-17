import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../shared/components/icon/icon';

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './help.html',
  styleUrl: './help.scss',
})
export class HelpComponent {
  readonly openIndex = signal<number | null>(0);

  readonly faqs: FaqItem[] = [
    {
      question: 'How do I buy a ticket?',
      answer:
        'Browse events, open the one you like, choose your ticket type and quantity, then check out and pay with M-Pesa. Your ticket with a QR code is generated automatically once payment is confirmed.',
    },
    {
      question: 'How does M-Pesa payment work?',
      answer:
        'After confirming your order, you will receive an M-Pesa STK push prompt on your phone. Enter your M-Pesa PIN to complete payment. We only confirm your order once M-Pesa confirms the transaction.',
    },
    {
      question: 'Where do I find my tickets?',
      answer:
        'Once payment is confirmed, your tickets appear instantly under My Tickets in your dashboard, each with a unique QR code for entry.',
    },
    {
      question: 'Can I get a refund?',
      answer:
        'Refund policies are set by individual event organizers. Please contact the organizer listed on your event page for refund requests.',
    },
    {
      question: 'How do I sell tickets for my own event?',
      answer:
        'Click "Sell Your Event" to register as an organizer. Once approved, you can create events, set ticket types and pricing, and track sales from your organizer dashboard.',
    },
  ];

  toggle(index: number): void {
    this.openIndex.set(this.openIndex() === index ? null : index);
  }
}
