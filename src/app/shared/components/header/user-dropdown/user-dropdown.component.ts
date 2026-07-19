import { Component, inject, OnInit } from '@angular/core';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-user-dropdown',
  templateUrl: './user-dropdown.component.html',
  imports:[CommonModule,RouterModule,DropdownComponent]
})
export class UserDropdownComponent implements OnInit {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  isOpen = false;
  userName = '';
  userEmail = '';
  userInitials = '';
  loading = true;

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  closeDropdown() {
    this.isOpen = false;
  }

  ngOnInit(): void {
    this.loadUser();
  }

  private loadUser(): void {
    const token = this.authService.getAccessToken();
    if (!token) {
      this.loading = false;
      return;
    }

    this.authService.me(token).subscribe({
      next: (profile: any) => {
        const user = profile?.user || profile?.data || profile;
        this.userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User';
        this.userEmail = user.email || '';
        this.userInitials = this.getInitials(user);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private getInitials(user: any): string {
    const first = (user.firstName || '').charAt(0);
    const last = (user.lastName || '').charAt(0);
    return (first + last).toUpperCase() || 'U';
  }

  onSignOut(): void {
    const refreshToken = localStorage.getItem('refresh_token_saas') || sessionStorage.getItem('refresh_token_saas');
    const token = this.authService.getAccessToken();
    if (token) {
      this.authService.logout({ refreshToken: refreshToken || '' }, token).subscribe({
        next: () => {
          this.toastService.success('Signed out successfully');
        },
        error: () => {
          this.toastService.error('Sign out failed. Please try again.');
        }
      });
    }
    this.closeDropdown();
  }
}
