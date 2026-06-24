import { Component } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-forgotpassword-form',
  imports: [
    LabelComponent,
    ButtonComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule    
  ],
  templateUrl: './forgotpassword-form.component.html',
  styles: ''
})
export class ForgotpasswordFormComponent {
  
  email = '';
  
  onSignIn() {
    console.log('Email:', this.email);
  }
}
