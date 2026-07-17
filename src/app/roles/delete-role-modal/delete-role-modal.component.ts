import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { EdobService } from '../../core/services/edob.service';

@Component({
  selector: 'app-delete-role-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './delete-role-modal.component.html',
  styles: ``
})
export class DeleteRoleModalComponent {
  readonly role = input.required<any>();
  readonly orgId = input<string>('');
  readonly close = output<void>();
  readonly deleted = output<void>();

  deleting = false;
  statusMessage = '';
  statusType: '' | 'success' | 'error' = '';

  constructor(private edobService: EdobService) {}

  cancel(): void {
    this.close.emit();
  }

  confirm(): void {
    if (!this.role()?.id || this.deleting) return;
    const orgId = this.orgId();
    if (!orgId) {
      this.statusType = 'error';
      this.statusMessage = 'Organization context is missing. Please reload the page and try again.';
      return;
    }
    this.deleting = true;
    this.statusMessage = '';
    this.statusType = '';
    this.edobService.deleteRole(orgId, this.role().id).subscribe({
      next: () => {
        this.deleting = false;
        this.statusType = 'success';
        this.statusMessage = `${this.role()?.name || 'Role'} has been deleted successfully.`;
        setTimeout(() => this.deleted.emit(), 900);
      },
      error: (err: any) => {
        this.deleting = false;
        this.statusType = 'error';
        this.statusMessage = err?.error?.message || err?.message || 'Failed to delete role. Please try again.';
      }
    });
  }
}
