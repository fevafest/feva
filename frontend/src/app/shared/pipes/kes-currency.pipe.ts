import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'kes', standalone: true })
export class KesCurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(value)) return 'KES 0';
    return `KES ${value.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
  }
}
