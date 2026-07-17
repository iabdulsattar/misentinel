import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { EdobService } from '../../core/services/edob.service';

@Component({
  selector: 'app-deactivate-role-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './deactivate-role-modal.component.html',
  styles: ``
})
export class DeactivateRoleModalComponent {
  readonly role = input.required<any>();
  readonly orgId = input<string>('');
  readonly close = output<void>();
  readonly deactivated = output<void>();

  deactivating = false;
  statusMessage = '';
  statusType: '' | 'success' | 'error' = '';

  constructor(private edobService: EdobService) {}

  cancel(): void {
    this.close.emit();
  }

  confirm(): void {
    if (!this.role()?.id || this.deactivating) return;
    const orgId = this.orgId();
    if (!orgId) {
      this.statusType = 'error';
      this.statusMessage = 'Organization context is missing. Please reload the page and try again.';
      return;
    }
    this.deactivating = true;
    this.statusMessage = '';
    this.statusType = '';
    this.edobService.deactivateRole(orgId, this.role().id).subscribe({
      next: () => {
        this.deactivating = false;
        this.statusType = 'success';
        this.statusMessage = `${this.role()?.name || 'Role'} has been deactivated successfully.`;
        setTimeout(() => this.deactivated.emit(), 900);
      },
      error: (err: any) => {
        this.deactivating = false;
        this.statusType = 'error';
        this.statusMessage = err?.error?.message || err?.message || 'Failed to deactivate role. Please try again.';
      }
    });
  }
}
