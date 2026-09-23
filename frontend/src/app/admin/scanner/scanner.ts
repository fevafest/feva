import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import QrScanner from 'qr-scanner';
import { TicketService, VerifyResult } from '../../core/services/ticket.service';
import { Ticket, TicketHolder } from '../../core/models/ticket.model';
import { NotificationService } from '../../core/services/notification.service';
import { IconComponent } from '../../shared/components/icon/icon';

QrScanner.WORKER_PATH = '/qr-scanner-worker.min.js';

@Component({
  selector: 'app-scanner',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './scanner.html',
  styleUrl: './scanner.scss',
})
export class ScannerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoEl') videoEl!: ElementRef<HTMLVideoElement>;

  readonly scanning = signal(false);
  readonly cameraError = signal('');
  readonly result = signal<VerifyResult | null>(null);
  readonly checkingResult = signal(false);
  readonly markingUsed = signal(false);
  readonly manualTicketId = signal('');

  private qrScanner?: QrScanner;
  private locked = false;

  constructor(private readonly ticketService: TicketService, private readonly notify: NotificationService) {}

  ngAfterViewInit(): void {
    this.qrScanner = new QrScanner(
      this.videoEl.nativeElement,
      (result) => this.handleScan(result.data),
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
        maxScansPerSecond: 4,
      }
    );
  }

  ngOnDestroy(): void {
    this.qrScanner?.stop();
    this.qrScanner?.destroy();
  }

  async startScanning(): Promise<void> {
    this.cameraError.set('');
    try {
      await this.qrScanner?.start();
      this.scanning.set(true);
    } catch {
      this.cameraError.set('Could not access the camera. Please grant camera permission and try again.');
    }
  }

  stopScanning(): void {
    this.qrScanner?.stop();
    this.scanning.set(false);
  }

  // A camera scan admits the holder in one step, so the same QR can never be
  // scanned through the door twice. Manual lookup stays read-only.
  private handleScan(qrData: string): void {
    if (this.locked) return;
    this.locked = true;
    this.verify({ qrData, consume: true });
  }

  lookupManual(): void {
    const ticketId = this.manualTicketId().trim();
    if (!ticketId) return;
    this.verify({ ticketId });
  }

  private verify(payload: { qrData?: string; ticketId?: string; consume?: boolean }): void {
    this.checkingResult.set(true);
    this.ticketService.verify(payload).subscribe({
      next: (res) => {
        this.result.set(res.data ?? null);
        this.checkingResult.set(false);
        setTimeout(() => (this.locked = false), 2500);
      },
      error: (err) => {
        this.checkingResult.set(false);
        this.notify.error(err.error?.message || 'Could not verify ticket.');
        setTimeout(() => (this.locked = false), 1500);
      },
    });
  }

  markUsed(): void {
    const ticket = this.result()?.ticket;
    if (!ticket) return;

    this.markingUsed.set(true);
    this.ticketService.markUsed(ticket.ticketId).subscribe({
      next: (res) => {
        this.markingUsed.set(false);
        this.notify.success('Ticket marked as used.');
        this.result.set({ valid: false, reason: 'ALREADY_USED', ticket: res.data });
      },
      error: (err) => {
        this.markingUsed.set(false);
        this.notify.error(err.error?.message || 'Could not update ticket.');
      },
    });
  }

  reset(): void {
    this.result.set(null);
    this.manualTicketId.set('');
  }

  holderName(ticket: Ticket): string {
    return typeof ticket.user === 'string' ? ticket.user : (ticket.user as TicketHolder).fullName;
  }
}
