import { Injectable, signal } from '@angular/core';

// Shape returned inside the login response `data.serviceAccess` block.
export interface ServiceAccessGrant {
  serviceCode: string;
  wildcard?: boolean;
  permissions?: string[];
  roles?: { id?: string; code?: string; name?: string }[];
  [key: string]: any;
}

const STORAGE_KEY = 'service_access_saas';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  // Reactive view of the current permission set, so consumers (sidebar,
  // templates) update the moment grants change — regardless of CD timing.
  private readonly grantsSignal = signal<ServiceAccessGrant[]>([]);

  get grants(): ServiceAccessGrant[] {
    return this.grantsSignal();
  }

  /**
   * Persist the serviceAccess block from a successful login response.
   * Accepts either a single grant object or an array of grants (the API may
   * return `data.serviceAccess` as a single object, not an array).
   */
  setServiceAccess(grants: ServiceAccessGrant | ServiceAccessGrant[] | undefined): void {
    let next: ServiceAccessGrant[] = [];
    if (Array.isArray(grants)) {
      next = grants;
    } else if (grants && typeof grants === 'object') {
      next = [grants];
    }
    this.grantsSignal.set(next);
    console.log('[PermissionService] serviceAccess set:', next.length, 'grant(s)',
      next.flatMap((g) => g.permissions ?? []));

    const remember = localStorage.getItem('remember_device');
    const value = JSON.stringify(next);
    if (remember === 'true') {
      localStorage.setItem(STORAGE_KEY, value);
    } else {
      sessionStorage.setItem(STORAGE_KEY, value);
      // Mirror into localStorage too so a page refresh restores it from the
      // same place regardless of the remember flag at read time.
      localStorage.setItem(STORAGE_KEY, value);
    }
  }

  /** Read persisted grants (e.g. after a page refresh). */
  restore(): void {
    const raw =
      sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      console.log('[PermissionService] no persisted service access found');
      this.grantsSignal.set([]);
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      const grants = Array.isArray(parsed) ? parsed : [parsed];
      // An empty array is a stale artifact (e.g. written before the
      // object-vs-array fix). Treat it as "not set" so it can't mask real
      // grants written by a later login, and clear the stale key.
      if (grants.length === 0) {
        console.log('[PermissionService] stale empty service access cleared');
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
        this.grantsSignal.set([]);
        return;
      }
      this.grantsSignal.set(grants);
      console.log('[PermissionService] restored', grants.length, 'grant(s)');
    } catch {
      this.grantsSignal.set([]);
    }
  }

  clear(): void {
    this.grantsSignal.set([]);
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  getServiceAccess(): ServiceAccessGrant[] {
    return this.grantsSignal();
  }

  getPermissions(): string[] {
    const out = new Set<string>();
    for (const g of this.grantsSignal()) {
      for (const p of g.permissions ?? []) {
        if (p) out.add(p);
      }
    }
    return Array.from(out);
  }

  /** True when the user has at least one service grant. */
  hasAnyService(): boolean {
    return this.grantsSignal().some((g) => !!g.serviceCode);
  }

  /** True when the user may access the given service code (e.g. "edob"). */
  canAccessService(serviceCode: string): boolean {
    return this.grantsSignal().some((g) => g.serviceCode === serviceCode);
  }

  /**
   * True when the user holds the given permission. A grant with `wildcard: true`
   * grants every permission for that service, so the user passes the check for
   * any specified permission string.
   */
  hasPermission(permission: string): boolean {
    if (!permission) return false;
    const normalized = permission.trim();
    if (this.getPermissions().includes(normalized)) return true;
    // wildcard grants cover every permission
    return this.grantsSignal().some((g) => g.wildcard === true);
  }

  /** True when the user holds ALL of the given permissions. */
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every((p) => this.hasPermission(p));
  }

  /** True when the user holds AT LEAST ONE of the given permissions. */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some((p) => this.hasPermission(p));
  }

  /**
   * True when the user is an organisation administrator.
   *
   * There is no role field the client can trust here: `/auth/me` does not type a
   * role, and the identity `role` string is never persisted. Authorisation in
   * this app is decided purely by the permission strings inside the grants, and
   * the admin tier is the `admin.*` namespace (`admin.users.manage`,
   * `admin.roles.manage`). A member is granted entry-level permissions only, so
   * holding any `admin.*` permission - or a wildcard grant - is what
   * distinguishes an administrator. Billing, trials and subscription management
   * are gated on this.
   */
  isOrgAdmin(): boolean {
    const grants = this.grantsSignal();

    // A wildcard grant already passes every `hasPermission` check, so it has to
    // count as admin here too or admins would be locked out of billing.
    if (grants.some((g) => g.wildcard === true)) {
      return true;
    }

    return grants.some((g) =>
      (g.permissions ?? []).some((p) =>
        typeof p === 'string' && p.trim().toLowerCase().startsWith('admin.')
      )
    );
  }
}
