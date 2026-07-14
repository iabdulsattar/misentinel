import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { UserService } from '../../core/services/user.service';
import { DeactivateReason } from '../../core/models/user.models';

@Component({
  selector: 'app-deactivate-user-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './deactivate-user-modal.component.html',
  styles: ``
})
export class DeactivateUserModalComponent {
  readonly user = input.required<any>();
  readonly close = output<void>();
  readonly deactivated = output<void>();

  reasons: { label: string; value: DeactivateReason }[] = [
    { label: 'Employee exit', value: 'LEFT_COMPANY' },
    { label: 'Policy violation', value: 'POLICY_VIOLATION' },
    { label: 'Extended leave', value: 'TEMPORARY_LEAVE' },
    { label: 'Duplicate account', value: 'ROLE_CHANGE' },
    { label: 'Other', value: 'OTHER' },
  ];

  selectedReason: DeactivateReason | '' = '';
  additionalNote = '';
  submitting = false;

  constructor(private userService: UserService) {}

  cancel(): void {
    this.close.emit();
  }

  isOtherSelected(): boolean {
    return this.selectedReason === 'OTHER';
  }

  canSubmit(): boolean {
    if (!this.selectedReason) return false;
    if (this.selectedReason === 'OTHER' && !this.additionalNote.trim()) return false;
    return true;
  }

  confirm(): void {
    if (!this.user()?.id || !this.selectedReason) return;
    this.submitting = true;
    this.userService.deactivateUser('', this.user().id, {
      reason: this.selectedReason,
      note: this.additionalNote || undefined,
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.deactivated.emit();
      },
      error: () => {
        this.submitting = false;
        alert('Failed to deactivate user.');
      }
    });
  }
}
