import { Injectable, signal, computed } from '@angular/core';
import {
  getStoredTimezone,
  setStoredTimezone,
  getBrowserTimezone,
  getEffectiveTimezone,
  formatUtcToLocal,
  formatUtcToLocalDateOnly,
  formatUtcToLocalTimeOnly,
  formatUtcToLocalRelative,
  toUtcIsoString,
  parseUtcToDate,
  isValidIsoString,
  DEFAULT_TIMEZONE,
} from '../utils/date-time.utils';

@Injectable({ providedIn: 'root' })
export class DateTimeService {
  private readonly _timezone = signal<string>(DEFAULT_TIMEZONE);
  private readonly _initialized = signal(false);

  readonly timezone = computed(() => this._timezone());
  readonly initialized = computed(() => this._initialized());

  initialize(): void {
    if (this._initialized()) return;
    this._timezone.set(getEffectiveTimezone());
    this._initialized.set(true);
  }

  setTimezone(timezone: string): void {
    this._timezone.set(timezone);
    setStoredTimezone(timezone);
  }

  resetToBrowser(): void {
    const browserTz = getBrowserTimezone();
    this._timezone.set(browserTz);
    setStoredTimezone(browserTz);
  }

  format(
    isoString: string | Date | null | undefined,
    options?: Intl.DateTimeFormatOptions
  ): string {
    return formatUtcToLocal(isoString, options, this._timezone());
  }

  formatDateOnly(isoString: string | Date | null | undefined): string {
    return formatUtcToLocalDateOnly(isoString, this._timezone());
  }

  formatTimeOnly(isoString: string | Date | null | undefined): string {
    return formatUtcToLocalTimeOnly(isoString, this._timezone());
  }

  formatRelative(isoString: string | Date | null | undefined): string {
    return formatUtcToLocalRelative(isoString, this._timezone());
  }

  toUtcIso(date: Date): string {
    return toUtcIsoString(date);
  }

  parse(isoString: string): Date | null {
    return parseUtcToDate(isoString);
  }

  isValid(isoString: string): boolean {
    return isValidIsoString(isoString);
  }

  getCurrentTimezone(): string {
    return this._timezone();
  }

  getBrowserTimezone(): string {
    return getBrowserTimezone();
  }
}