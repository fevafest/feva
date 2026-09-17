import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type IconName =
  | 'dashboard'
  | 'ticket'
  | 'orders'
  | 'profile'
  | 'logout'
  | 'calendar-event'
  | 'users'
  | 'briefcase'
  | 'credit-card'
  | 'chart'
  | 'settings'
  | 'scan'
  | 'plus'
  | 'edit'
  | 'trash'
  | 'upload'
  | 'qr-code'
  | 'arrow-right'
  | 'search'
  | 'location'
  | 'clock'
  | 'phone'
  | 'mail'
  | 'check'
  | 'x'
  | 'menu'
  | 'home'
  | 'star'
  | 'filter'
  | 'download'
  | 'eye'
  | 'eye-off'
  | 'check-circle'
  | 'x-circle'
  | 'alert-circle'
  | 'chevron-right'
  | 'chevron-down'
  | 'bell'
  | 'wallet'
  | 'file-text'
  | 'image'
  | 'plane'
  | 'sun'
  | 'megaphone'
  | 'shield';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './icon.html',
})
export class IconComponent {
  @Input() name: IconName = 'home';
  @Input() size = 20;
}
