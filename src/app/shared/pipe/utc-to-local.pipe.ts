import { Pipe, PipeTransform, inject } from '@angular/core';
import { DateTimeService } from '../services/date-time.service';

@Pipe({
  name: 'utcToLocal',
  standalone: true,
  pure: false,
})
export class UtcToLocalPipe implements PipeTransform {
  private readonly dateTimeService = inject(DateTimeService);

  transform(
    value: string | Date | null | undefined,
    format: 'full' | 'date' | 'time' | 'relative' | Intl.DateTimeFormatOptions = 'full'
  ): string {
    if (!value) return '—';

    switch (format) {
      case 'date':
        return this.dateTimeService.formatDateOnly(value);
      case 'time':
        return this.dateTimeService.formatTimeOnly(value);
      case 'relative':
        return this.dateTimeService.formatRelative(value);
      default:
        if (typeof format === 'object') {
          return this.dateTimeService.format(value, format);
        }
        return this.dateTimeService.format(value);
    }
  }
}