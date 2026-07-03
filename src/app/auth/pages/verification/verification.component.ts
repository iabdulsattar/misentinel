import { Component } from '@angular/core';
import { VerificationFormComponent } from '../../components/verification-form/verification-form.component';
import { AuthPageLayoutComponent } from '../../../layout/auth-page-layout/auth-page-layout.component';

@Component({
  selector: 'app-verification',
  imports: [
    VerificationFormComponent,
    AuthPageLayoutComponent
  ],
  templateUrl: './verification.component.html',
  styles: ''
  
})
export class VerificationComponent {

}
