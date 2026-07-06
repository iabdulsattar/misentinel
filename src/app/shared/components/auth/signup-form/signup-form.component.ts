
import { Component } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SelectComponent } from '../../form/select/select.component';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup-form',
  imports: [
    LabelComponent,
    CheckboxComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule,
    SelectComponent
],
  templateUrl: './signup-form.component.html',
  styles: ``
})
export class SignupFormComponent {

  constructor(private authService: AuthService, private router: Router) {}
  
  showPassword = false;
  confirmPassword = false;
  isCheckedOne = false;  
  isChecked = true;

  fname = '';
  lname = '';
  jtitle = '';
  cname = '';
  pnumber = '';
  selectedValue = '';  
  email = '';
  password = '';
  confirmpassword = '';

  // NEW
  country = '';

  isLoading = false;
  successMessage = '';
  errorMessage = '';

  // Validation errors
  errors = {
    fname: '',
    lname: '',
    jtitle: '',
    cname: '',
    country: '',
    pnumber: '',
    email: '',
    password: '',
    confirmpassword: ''
  };

  options = [
    { value: '5', label: '5' },
  ];

  handleSelectChange(value: string) {
    this.selectedValue = value;
    console.log('Selected value:', value);
  }
  
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  togglePasswordVisibilityOne() {
    this.confirmPassword = !this.confirmPassword;
  }

  // NEW
  generateSlug(name: string) {
    return name.toLowerCase().replace(/\s+/g, '-');
  }

  validateForm(): boolean {
    let isValid = true;
    this.errors = {
      fname: '',
      lname: '',
      jtitle: '',
      cname: '',
      country: '',
      pnumber: '',
      email: '',
      password: '',
      confirmpassword: ''
    };

    if (!this.fname.trim()) {
      this.errors.fname = 'First name is required';
      isValid = false;
    }

    if (!this.lname.trim()) {
      this.errors.lname = 'Last name is required';
      isValid = false;
    }

    if (!this.jtitle.trim()) {
      this.errors.jtitle = 'Job title is required';
      isValid = false;
    }

    if (!this.cname.trim()) {
      this.errors.cname = 'Company name is required';
      isValid = false;
    }

    if (!this.country.trim()) {
      this.errors.country = 'Country is required';
      isValid = false;
    } else if (this.country.length !== 2) {
      this.errors.country = 'Country must be a 2-letter code (e.g., US, PK)';
      isValid = false;
    }

    if (!this.pnumber.trim()) {
      this.errors.pnumber = 'Phone number is required';
      isValid = false;
    }

    if (!this.email.trim()) {
      this.errors.email = 'Email is required';
      isValid = false;
    } else if (!this.isValidEmail(this.email)) {
      this.errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!this.password) {
      this.errors.password = 'Password is required';
      isValid = false;
    } else if (this.password.length < 12) {
      this.errors.password = 'Password must be at least 12 characters';
      isValid = false;
    }

    if (!this.confirmpassword) {
      this.errors.confirmpassword = 'Please confirm your password';
      isValid = false;
    } else if (this.password !== this.confirmpassword) {
      this.errors.confirmpassword = 'Passwords do not match';
      isValid = false;
    }

    if (!this.isChecked) {
      alert('Please agree to the Terms of Service and Privacy Policy');
      isValid = false;
    }

    return isValid;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return emailRegex.test(email);
  }
  
  // onSignIn() {
  // onSignUp() {
  //   console.log('First Name:', this.fname);
  //   console.log('Last Name:', this.lname);
  //   console.log('Job Title:', this.jtitle);
  //   console.log('Company Name:', this.cname);
  //   console.log('Country:', this.country);    
  //   console.log('Phone Number:', this.pnumber);
  //   console.log('Number of Employees:', this.selectedValue);
    
  //   console.log('Email:', this.email);
  //   console.log('Password:', this.password);
  //   console.log('Confirm Password:', this.confirmpassword);

  //   console.log('Remember Me:', this.isCheckedOne);
  //   console.log('Remember Me:', this.isChecked);
  // }

onSignUp() {
  if (!this.validateForm()) {
    return;
  }

  const payload = {
    organizationName: this.cname,
    organizationSlug: this.generateSlug(this.cname),
    country: this.country,
    email: this.email,
    password: this.password,
    firstName: this.fname,
    lastName: this.lname,
    jobTitle: this.jtitle,
    phoneNumber: this.pnumber,
    employeeCount: this.selectedValue,
    receiveProductUpdates: this.isChecked,
    acceptedTerms: this.isChecked
  };

  this.isLoading = true;
  this.successMessage = '';
  this.errorMessage = '';

  this.authService.signup(payload).subscribe({
    next: (res) => {
      console.log('Signup successful:', res);
      localStorage.setItem('org_id', res.organization.id);
      this.successMessage = 'Account created successfully! Signing you in...';

      // Auto-login after signup
      const loginPayload = {
        email: this.email,
        password: this.password
      };

      this.authService.login(loginPayload).subscribe({
        next: (loginRes) => {
          console.log('Login successful:', loginRes);
          localStorage.setItem('access_token', loginRes.tokens.access_token);
          localStorage.setItem('refresh_token', loginRes.tokens.refresh_token);
          this.isLoading = false;
          this.router.navigate(['/']);
        },
        error: (loginErr) => {
          console.error('Auto-login error:', loginErr);
          this.isLoading = false;
          this.successMessage = 'Account created! Please sign in manually.';
          setTimeout(() => {
            this.router.navigate(['/sign-in']);
          }, 2000);
        }
      });
    },
    error: (err) => {
      console.error('Signup error:', err);
      console.error('Error status:', err.status);
      console.error('Error message:', err.message);
      console.error('Error body:', JSON.stringify(err.error, null, 2));
      console.error('Payload being sent:', JSON.stringify(payload, null, 2));
      
      if (err.status === 409) {
        this.errorMessage = err.error?.detail || 'Email or company name already registered. Please use a different email or sign in.';
      }
      
      this.isLoading = false;
    }
  });
}  
}
