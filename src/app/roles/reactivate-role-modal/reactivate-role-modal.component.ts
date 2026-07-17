import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { EdobService } from '../../core/services/edob.service';

@Component({
  selector: 'app-reactivate-role-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './reactivate-role-modal.component.html',
  styles: ``
})
export class ReactivateRoleModalComponent {
  readonly role = input.required<any>();
  readonly orgId = input<string>('');
  readonly close = output<void>();
  readonly reactivated = output<void>();

  reactivating = false;
  statusMessage = '';
  statusType: '' | 'success' | 'error' = '';

  constructor(private edobService: EdobService) {}

  cancel(): void {
    this.close.emit();
  }

  confirm(): void {
    if (!this.role()?.id || this.reactivating) return;
    const orgId = this.orgId();
    if (!orgId) {
      this.statusType = 'error';
      this.statusMessage = 'Organization context is missing. Please reload the page and try again.';
      return;
    }
    this.reactivating = true;
    this.statusMessage = '';
    this.statusType = '';
    this.edobService.reactivateRole(orgId, this.role().id).subscribe({
      next: () => {
        this.reactivating = false;
        this.statusType = 'success';
        this.statusMessage = `${this.role()?.name || 'Role'} has been reactivated successfully.`;
        setTimeout(() => this.reactivated.emit(), 900);
      },
      error: (err: any) => {
        this.reactivating = false;
        this.statusType = 'error';
        this.statusMessage = err?.error?.message || err?.message || 'Failed to reactivate role. Please try again.';
      }
    });
  }
}
