

import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-range-slider',
  imports: [],
  
  templateUrl: './range-slider.component.html',
  styleUrl: './range-slider.component.css'
})
export class RangeSliderComponent {

  @Input() min = 10;
  @Input() max = 500;
  @Input() step = 1;
  @Input() value = 250;

  @Output() valueChange = new EventEmitter<number>();

  get fillPercentage(): number {
    if (this.max === this.min) {
      return 0;
    }

    return ((this.value - this.min) / (this.max - this.min)) * 100;
  }

  get labels(): number[] {
    const result: number[] = [];

    if (this.min <= 0 || this.min >= this.max) {
      return result;
    }

    result.push(this.min);

    for (
      let i = Math.floor(this.min / 100) + 1;
      i <= Math.floor(this.max / 100);
      i++
    ) {
      const value = i * 100;

      if (value > this.min && value < this.max) {
        result.push(value);
      }
    }

    if (this.max !== result[result.length - 1]) {
      result.push(this.max);
    }

    return result;
  }

  getLabelPosition(label: number): number {
    if (this.max === this.min) {
      return 0;
    }

    return ((label - this.min) / (this.max - this.min)) * 100;
  }

  onSliderChange(event: Event): void {
    const input = event.target as HTMLInputElement;

    let newValue = Number(input.value);

    newValue = Math.round(newValue / this.step) * this.step;

    newValue = Math.max(this.min, Math.min(this.max, newValue));

    this.value = newValue;

    this.valueChange.emit(this.value);
  }
}