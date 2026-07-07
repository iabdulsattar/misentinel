import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { CheckboxComponent } from '../../../shared/components/form/input/checkbox.component';
import { SelectComponent } from '../../../shared/components/form/select/select.component';

@Component({
  selector: 'app-signup-form',
  imports: [
    RouterModule,
    FormsModule,
    InputFieldComponent,
    LabelComponent,
    CheckboxComponent,
    SelectComponent
  ],
  templateUrl: './signup-form.component.html',
  styles: ''
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
    { value: '1-50', label: '1–50' },
    { value: '51-100', label: '51–100' },
    { value: '101-500', label: '101–500' },
    { value: '500+', label: '500+' },
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

  // Country options for dropdown (2-letter country codes)
  countryOptions = [
    { value: 'US', label: 'United States (US)' },
    { value: 'PK', label: 'Pakistan (PK)' },
    { value: 'CA', label: 'Canada (CA)' },
    { value: 'GB', label: 'United Kingdom (GB)' },
    { value: 'AU', label: 'Australia (AU)' },
    { value: 'DE', label: 'Germany (DE)' },
    { value: 'FR', label: 'France (FR)' },
    { value: 'IN', label: 'India (IN)' },
    { value: 'AE', label: 'United Arab Emirates (AE)' },
    { value: 'SG', label: 'Singapore (SG)' },
  ];


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

    const nameAlphaRegex = /^[A-Za-z]+$/;
    const employeeAllowed = new Set(['1-50', '51-100', '101-500', '500+']);


    if (!this.fname.trim()) {
      this.errors.fname = 'First name is required';
      isValid = false;
    } else if (!nameAlphaRegex.test(this.fname.trim())) {
      this.errors.fname = 'First name must contain alphabets only';
      isValid = false;
    }

    if (!this.lname.trim()) {
      this.errors.lname = 'Last name is required';
      isValid = false;
    } else if (!nameAlphaRegex.test(this.lname.trim())) {
      this.errors.lname = 'Last name must contain alphabets only';
      isValid = false;
    }


    // Job Title (optional): do not enforce any character validation
    // (If provided, we only send it to the API as-is.)


    // Company Name (optional): if provided, allow alphabets, numbers, and special characters
    if (this.cname.trim()) {
      // Allow letters/numbers/spaces and common special characters
      const companyRegex = /^[A-Za-z0-9\s\-\.,&()'"/]+$/;
      if (!companyRegex.test(this.cname.trim())) {
        this.errors.cname = 'Company name contains invalid characters';
        isValid = false;
      }
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
    } else {
      const phoneDigitsRegex = /^[0-9]+$/;
      if (!phoneDigitsRegex.test(this.pnumber.trim())) {
        this.errors.pnumber = 'Phone number must contain digits only';
        isValid = false;
      }
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
    } else {
      // Must include: uppercase, lowercase, number, special character
      const upperRegex = /[A-Z]/;
      const lowerRegex = /[a-z]/;
      const numberRegex = /[0-9]/;
      const specialRegex = /[^A-Za-z0-9]/;

      if (this.password.length < 12) {
        this.errors.password = 'Password must be at least 12 characters';
        isValid = false;
      } else if (!upperRegex.test(this.password) || !lowerRegex.test(this.password) || !numberRegex.test(this.password) || !specialRegex.test(this.password)) {
        this.errors.password = 'Password must include uppercase, lowercase, number, and special character';
        isValid = false;
      }
    }


    if (!this.confirmpassword) {
      this.errors.confirmpassword = 'Please confirm your password';
      isValid = false;
    } else if (this.password !== this.confirmpassword) {
      this.errors.confirmpassword = 'Passwords do not match';
      isValid = false;
    }

    // Number of Employees (optional): if selected, must be one of allowed values
    if (this.selectedValue && !employeeAllowed.has(this.selectedValue)) {
      this.isLoading = false;
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

    const payload: any = {
      country: this.country,
      email: this.email,
      password: this.password,
      firstName: this.fname,
      lastName: this.lname,
      phoneNumber: this.pnumber,
      receiveProductUpdates: this.isCheckedOne,
      acceptedTerms: this.isChecked,
      organizationSlug: this.cname ? this.generateSlug(this.cname) : '',
      organizationName: this.cname,
    };

    // Optional fields: include only if user provided them
    if (this.jtitle.trim()) payload.jobTitle = this.jtitle.trim();
    if (this.cname.trim()) payload.organizationName = this.cname.trim();
    if (this.selectedValue) payload.employeeCount = this.selectedValue;

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.authService.signup(payload).subscribe({
      next: (res) => {
        console.log('Signup successful:', res);
        const orgId = res?.organization?.id || res?.membership?.id;
        const userEmail = res?.user?.email || this.email;

        if (orgId) {
          localStorage.setItem('org_id', orgId);
        }
        this.successMessage = 'Account created successfully! Please verify your email.';

        try {
          localStorage.setItem('verification_email', userEmail);
        } catch {
          // ignore storage errors
        }
        this.isLoading = false;
        this.router.navigate(['/verification']);
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


