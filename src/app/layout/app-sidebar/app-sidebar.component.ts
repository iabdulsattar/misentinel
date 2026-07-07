import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { Subscription } from 'rxjs';
import { SidebarService } from '../../shared/services/sidebar.service';
import { SafeHtmlPipe } from '../../shared/pipe/safe-html.pipe';
import { AuthService } from '../../core/services/auth.service';
import { ProfileResponse, SessionOrganization, SessionResponse } from '../../core/models/auth.models';

type NavItem = {
  name: string;
  icon: string;
  path: string;
};

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule, SafeHtmlPipe],
  templateUrl: './app-sidebar.component.html',
})
export class AppSidebarComponent {

  isLoading = false;
  profile?: ProfileResponse;
  session?: SessionResponse;

  get displayCompanyName(): string {
    const org = this.getActiveOrganization();
    return org?.name || org?.slug || '—';
  }

  get displayRoleName(): string {
    const org = this.getActiveOrganization();
    return org?.role || '—';
  }

  get displayUserName(): string {
    const first = this.profile?.firstName || '';
    const last = this.profile?.lastName || '';
    const full = `${first} ${last}`.trim();
    if (full) return full;

    const orgUser = this.getActiveOrganization()?.user;
    const orgFull = `${orgUser?.firstName || ''} ${orgUser?.lastName || ''}`.trim();
    if (orgFull) return orgFull;

    return this.profile?.email || '—';
  }

  private getActiveOrganization(): SessionOrganization | undefined {
    const orgs = this.session?.organizations || [];
    return orgs?.[0];
  }

  private async hydrateProfile(): Promise<void> {
    const remember = localStorage.getItem('remember_device');
    const accessToken = remember === 'true' ? localStorage.getItem('access_token_saas') : (localStorage.getItem('access_token_saas') || sessionStorage.getItem('access_token_saas')) || undefined;
    const refreshToken = remember === 'true' ? localStorage.getItem('refresh_token') : (localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token')) || undefined;

    const candidates = [accessToken].filter(Boolean) as string[];
    if (candidates.length === 0) {
      this.profile = undefined;
      this.session = undefined;
      return;
    }

    this.isLoading = true;
    let profile: ProfileResponse | undefined;
    let session: SessionResponse | undefined;

    for (const token of candidates) {
      let attempts = 0;
      const maxAttempts = 2;

      while (attempts < maxAttempts) {
        try {
          const [profileResult, sessionResult] = await Promise.all([
            lastValueFrom(this.authService.me(token)),
            lastValueFrom(this.authService.getSession(token)),
          ]);
          profile = profileResult;
          session = sessionResult;
          break;
        } catch (err: any) {
          attempts++;
          if (err.status === 401 && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
          this.clearAuthAndRedirect();
          return;
        }
      }
      if (profile && session) break;
    }

    this.profile = profile;
    this.session = session;
    this.isLoading = false;
  }

  private clearAuthAndRedirect(): void {
    localStorage.removeItem('access_token_saas');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('remember_device');
    localStorage.removeItem('session_expires_at');
    localStorage.removeItem('org_id');
    localStorage.removeItem('organizationId');
    sessionStorage.removeItem('access_token_saas');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('org_id');
    sessionStorage.removeItem('organizationId');
    this.router.navigate(['/signin']);
  }

  async ngOnInit() {
    await this.hydrateProfile();

    this.subscription.add(
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.sidebarService.setMobileOpen(false);
          this.hydrateProfile();
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }

  get isDobFeed(): boolean {
    return this.router.url.startsWith('/dob-feed');
  }

  get navItems(): NavItem[] {
    return this.isDobFeed ? this.dobNavItems : this.dashboardNavItems;
  }

  get othersItems(): NavItem[] {
    return this.isDobFeed ? this.dobOtherItems : this.dashboardOtherItems;
  }

  onSidebarMouseEnter() {
    this.isExpanded$.subscribe(expanded => {
      if (!expanded) {
        this.sidebarService.setHovered(true);
      }
    }).unsubscribe();
  }

  private icon(path: string): string {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="${path}" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  readonly dashboardNavItems: NavItem[] = [
    {
      name: 'Dashboard',
      path: '/',
      icon: this.icon('M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-8.5Z'),
    },
    {
      name: 'DOB Feed',
      path: '/dob-feed',
      icon: this.icon('M7 3h10v18H7V3Zm3 5h4M10 12h4M10 16h3'),
    },
    {
      name: 'Basic Entry',
      path: '/basic-entry',
      icon: this.icon('M12 2 4 6.5v9L12 22l8-6.5v-9L12 2Zm0 6v5M12 16h.01'),
    },
    {
      name: 'Incidever Entry',
      path: '/incident-entry',
      icon: this.icon('M16 11a4 4 0 1 0-8 0M4 21a8 8 0 0 1 16 0M17 8h4M19 6v4'),
    },
    {
      name: 'Follow-up Entry',
      path: '/follow-up-entry',
      icon: this.icon('M8 4h8M9 2h6v4H9V2ZM6 5h12v16H6V5Zm4 9 2 2 4-5'),
    },
  ];

  readonly dashboardOtherItems: NavItem[] = [
    {
      name: 'Reports',
      path: '/reports',
      icon: this.icon('M5 20V9m7 11V4m7 16v-7M3 20h18'),
    },
    {
      name: 'Audit Log',
      path: '/audit-log',
      icon: this.icon('M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01'),
    },
    {
      name: 'Users',
      path: '/users',
      icon: this.icon('M16 11a4 4 0 1 0-8 0M4 21a8 8 0 0 1 16 0M18 8a3 3 0 0 1 3 3M20 21a6 6 0 0 0-3-5.2'),
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: this.icon('M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0-5v3m0 12v3M4.2 4.2l2.1 2.1m11.4 11.4 2.1 2.1M1 12h3m16 0h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1'),
    },
  ];

  readonly dobNavItems: NavItem[] = [
    {
      name: 'Dashboard',
      path: '/',
      icon: this.icon('M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-8.5Z'),
    },
    {
      name: 'All Entries',
      path: '/dob-feed',
      icon: this.icon('M4 5h16v14H4V5Zm4 4h8M8 13h8M8 17h5'),
    },
    {
      name: 'Create Entry',
      path: '/create-entry',
      icon: this.icon('M12 8v8m-4-4h8M5 5h14v14H5V5Z'),
    },
    {
      name: 'Review Queue',
      path: '/review-queue',
      icon: this.icon('M12 3 4 9l8 12 8-12-8-6Zm0 6v5M12 17h.01'),
    },
  ];

  readonly dobOtherItems: NavItem[] = [
    {
      name: 'Reports',
      path: '/reports',
      icon: this.icon('M7 3h10v18H7V3Zm3 5h4M10 12h4M10 16h3'),
    },
    {
      name: 'Audit Log',
      path: '/audit-log',
      icon: this.icon('M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01'),
    },
    {
      name: 'Users',
      path: '/users',
      icon: this.icon('M16 11a4 4 0 1 0-8 0M4 21a8 8 0 0 1 16 0M18 8a3 3 0 0 1 3 3M20 21a6 6 0 0 0-3-5.2'),
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: this.icon('M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0-5v3m0 12v3M4.2 4.2l2.1 2.1m11.4 11.4 2.1 2.1M1 12h3m16 0h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1'),
    },
  ];

  readonly isExpanded$;
  readonly isMobileOpen$;
  readonly isHovered$;

  private subscription = new Subscription();

  constructor(
    public sidebarService: SidebarService,
    private router: Router,
    private authService: AuthService
  ) {
    this.isExpanded$ = this.sidebarService.isExpanded$;
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    this.isHovered$ = this.sidebarService.isHovered$;
  }

  logout() {
    const remember = localStorage.getItem('remember_device');
    const refreshToken = (remember === 'true' ? localStorage.getItem('refresh_token') : (localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token'))) || '';

    const callLogout = () => this.authService.logout({ refreshToken }).subscribe({
      next: () => {
        localStorage.removeItem('access_token_saas');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('remember_device');
        localStorage.removeItem('session_expires_at');
        sessionStorage.removeItem('access_token_saas');
        sessionStorage.removeItem('refresh_token');
        this.router.navigate(['/signin']);
      },
      error: () => {
        localStorage.removeItem('access_token_saas');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('remember_device');
        localStorage.removeItem('session_expires_at');
        sessionStorage.removeItem('access_token_saas');
        sessionStorage.removeItem('refresh_token');
        this.router.navigate(['/signin']);
      }
    });

    if (!refreshToken) {
      localStorage.removeItem('access_token_saas');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('remember_device');
      localStorage.removeItem('session_expires_at');
      sessionStorage.removeItem('access_token_saas');
      sessionStorage.removeItem('refresh_token');
      this.router.navigate(['/signin']);
      return;
    }

    callLogout();
  }
}
