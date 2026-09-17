import { Injectable, signal } from '@angular/core';
import { FevaEvent } from '../models/event.model';

export interface SelectedTicket {
  ticketTypeId: string;
  ticketTypeName: string;
  unitPrice: number;
  quantity: number;
}

export interface CheckoutSelection {
  event: FevaEvent;
  items: SelectedTicket[];
}

@Injectable({ providedIn: 'root' })
export class CheckoutStateService {
  readonly selection = signal<CheckoutSelection | null>(null);

  setSelection(selection: CheckoutSelection): void {
    this.selection.set(selection);
  }

  clear(): void {
    this.selection.set(null);
  }
}
