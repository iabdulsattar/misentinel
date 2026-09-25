import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, OnChanges, SimpleChanges, OnDestroy, AfterViewInit } from '@angular/core';
import flatpickr from 'flatpickr';
import { LabelComponent } from '../label/label.component';
import "flatpickr/dist/flatpickr.css";

@Component({
  selector: 'app-datetime-picker',
  imports: [LabelComponent],
  templateUrl: './datetime-picker.component.html',
  styles: ``
})
export class DateTimePickerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() id?: string;
  @Input() label?: string;
  @Input() placeholder: string = 'Select date & time';
  @Input() value?: string;
  @Input() defaultDate?: string | Date;

  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('dateTimeInput', { static: false }) dateTimeInput!: ElementRef<HTMLInputElement>;

  private flatpickrInstance: flatpickr.Instance | undefined;

  ngAfterViewInit() {
    if (!this.dateTimeInput || !this.dateTimeInput.nativeElement) {
      console.error('DateTimePickerComponent: dateTimeInput reference not found');
      return;
    }

    try {
      this.flatpickrInstance = flatpickr(this.dateTimeInput.nativeElement, {
        enableTime: true,
        time_24hr: true,
        dateFormat: 'd/m/Y H:i',
        minuteIncrement: 5,
        defaultDate: (this.value || this.defaultDate) as any,
        onChange: (_selectedDates, dateStr) => {
          // Convert from dd/mm/yyyy HH:mm to ISO format (yyyy-mm-ddTHH:mm)
          const parts = dateStr.split(' ');
          if (parts.length === 2) {
            const dateParts = parts[0].split('/');
            const timeParts = parts[1].split(':');
            if (dateParts.length === 3 && timeParts.length === 2) {
              const isoDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T${timeParts[0]}:${timeParts[1]}`;
              this.valueChange.emit(isoDate);
              return;
            }
          }
          this.valueChange.emit(dateStr.replace(' ', 'T'));
        }
      });
    } catch (error) {
      console.error('DateTimePickerComponent: Failed to initialize flatpickr:', error);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!changes['value'] || !this.flatpickrInstance) return;
    try {
      const current = changes['value'].currentValue;
      const previous = changes['value'].previousValue;
      if (current === previous) return;
      if (current) {
        // Convert ISO format (yyyy-mm-ddTHH:mm) to dd/mm/yyyy HH:mm for display
        const displayValue = this.convertToDisplayFormat(current);
        this.flatpickrInstance.setDate(displayValue, false);
      } else {
        this.flatpickrInstance.clear(false);
      }
    } catch (error) {
      console.error('DateTimePickerComponent: Error updating date in ngOnChanges:', error);
    }
  }

  private convertToDisplayFormat(isoDate: string): string {
    // Handle ISO format: yyyy-mm-ddTHH:mm or yyyy-mm-ddTHH:mm:ss
    if (isoDate.includes('T')) {
      const parts = isoDate.split('T');
      if (parts.length === 2) {
        const dateParts = parts[0].split('-');
        const timePart = parts[1].split(':').slice(0, 2).join(':');
        if (dateParts.length === 3) {
          return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]} ${timePart}`;
        }
      }
    }
    return isoDate;
  }

  ngOnDestroy() {
    if (this.flatpickrInstance) {
      this.flatpickrInstance.destroy();
    }
  }
}
