import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { ServiceUser, CreateUserRequest, UpdateUserRequest } from '../../core/models/user.models';

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './add-user.component.html',
  styles: ``
})
export class AddUserComponent implements OnInit {
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';
  isEditMode = false;
  userId: string | null = null;

  form = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    department: '',
    jobTitle: '',
    location: '',
    canAccessWeb: true,
    canAccessMobile: true,
  };

  constructor(
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.queryParamMap.get('id');
    this.isEditMode = !!this.userId;

    if (this.isEditMode && this.userId) {
      this.loadUser(this.userId);
    }
  }

  private getOrgId(): string | null {
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      return localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
    }
    return sessionStorage.getItem('org_id') || sessionStorage.getItem('organizationId') || localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
  }

  private loadUser(id: string): void {
    this.loading = true;
    this.errorMessage = '';
    const orgId = this.getOrgId();
    if (!orgId) {
      this.loading = false;
      this.errorMessage = 'Organization not found.';
      return;
    }

    this.userService.getUserDetail(orgId, id).subscribe({
      next: (user: ServiceUser) => {
        this.form.firstName = user.firstName || '';
        this.form.lastName = user.lastName || '';
        this.form.email = user.email || '';
        this.form.phoneNumber = user.phoneNumber || '';
        this.form.department = user.department || '';
        this.form.jobTitle = user.jobTitle || '';
        this.form.location = user.location || '';
        this.form.canAccessWeb = user.canAccessWeb ?? true;
        this.form.canAccessMobile = user.canAccessMobile ?? true;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Failed to load user details.';
      }
    });
  }

  submit(): void {
    if (!this.form.firstName.trim() || !this.form.lastName.trim() || !this.form.email.trim()) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    const orgId = this.getOrgId();
    if (!orgId) {
      this.saving = false;
      this.errorMessage = 'Organization not found.';
      return;
    }

    if (this.isEditMode && this.userId) {
      const payload: UpdateUserRequest = {
        firstName: this.form.firstName.trim(),
        lastName: this.form.lastName.trim(),
        phoneNumber: this.form.phoneNumber.trim() || undefined,
        department: this.form.department.trim() || undefined,
        jobTitle: this.form.jobTitle.trim() || undefined,
        location: this.form.location.trim() || undefined,
        canAccessWeb: this.form.canAccessWeb,
        canAccessMobile: this.form.canAccessMobile,
      };

      this.userService.updateUser(orgId, this.userId, payload).subscribe({
        next: () => {
          this.saving = false;
          this.successMessage = 'User updated successfully.';
          setTimeout(() => this.router.navigate(['/user-management']), 1000);
        },
        error: () => {
          this.saving = false;
          this.errorMessage = 'Failed to update user.';
        }
      });
    } else {
      const payload: CreateUserRequest = {
        firstName: this.form.firstName.trim(),
        lastName: this.form.lastName.trim(),
        email: this.form.email.trim(),
        phoneNumber: this.form.phoneNumber.trim() || undefined,
        department: this.form.department.trim() || undefined,
        jobTitle: this.form.jobTitle.trim() || undefined,
        location: this.form.location.trim() || undefined,
        canAccessWeb: this.form.canAccessWeb,
        canAccessMobile: this.form.canAccessMobile,
        sendInvite: true,
      };

      this.userService.createUser(orgId, payload).subscribe({
        next: () => {
          this.saving = false;
          this.successMessage = 'User created and invitation sent successfully.';
          setTimeout(() => this.router.navigate(['/user-management']), 1000);
        },
        error: () => {
          this.saving = false;
          this.errorMessage = 'Failed to create user.';
        }
      });
    }
  }
}
