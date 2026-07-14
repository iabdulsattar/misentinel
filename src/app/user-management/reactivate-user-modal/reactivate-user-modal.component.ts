import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-reactivate-user-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './reactivate-user-modal.component.html',
  styles: ``
})
export class ReactivateUserModalComponent {
  readonly user = input.required<any>();
  readonly close = output<void>();
  readonly reactivated = output<void>();

  submitting = false;

  constructor(private userService: UserService) {}

  cancel(): void {
    this.close.emit();
  }

  confirm(): void {
    if (!this.user()?.id) return;
    this.submitting = true;
    this.userService.reactivateUser('', this.user().id).subscribe({
      next: () => {
        this.submitting = false;
        this.reactivated.emit();
      },
      error: () => {
        this.submitting = false;
        alert('Failed to reactivate user.');
      }
    });
  }
}
