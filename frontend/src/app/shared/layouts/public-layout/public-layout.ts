import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../components/header/header';
import { FooterComponent } from '../../components/footer/footer';
import { ToastContainerComponent } from '../../components/toast-container/toast-container';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ToastContainerComponent],
  template: `
    <app-header />
    <main><router-outlet /></main>
    <app-footer />
    <app-toast-container />
  `,
})
export class PublicLayoutComponent {}
