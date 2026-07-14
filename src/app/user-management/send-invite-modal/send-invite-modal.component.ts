import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';

@Component({
  selector: 'app-send-invite-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './send-invite-modal.component.html',
  styles: ``
})
export class SendInviteModalComponent {
  readonly user = input.required<any>();
  readonly close = output<void>();
  readonly sent = output<void>();
  sending = false;

  cancel(): void {
    this.close.emit();
  }

  confirm(): void {
    this.sending = true;
    setTimeout(() => {
      this.sending = false;
      this.sent.emit();
    }, 600);
  }
}
