import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface EntryMetric {
  label: string;
  value: string;
  note: string;
  tone: string;
  icon: string;
}

@Component({
  selector: 'app-entries-metrics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './entries-metrics.component.html',
})
export class EntriesMetricsComponent {
  @Input() metrics: EntryMetric[] = [];

  iconSvg(path: string): string {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="${path}" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
}
