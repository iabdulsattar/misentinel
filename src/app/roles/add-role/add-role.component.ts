import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

interface Permission {
  key: string;
  name: string;
  description: string;
  checked: boolean;
  expanded: boolean;
}

interface PermissionGroup {
  title: string;
  permissions: Permission[];
}

@Component({
  selector: 'app-add-role',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './add-role.component.html',
  styles: ``,
})
export class AddRoleComponent {
  roleName = '';
  roleDesc = '';
  status: 'active' | 'inactive' = 'active';
  search = '';

  readonly maxNameLength = 100;
  readonly maxDescLength = 300;

  groups: PermissionGroup[] = [
    {
      title: 'Entry & Feed Management',
      permissions: [
        { key: 'entry.view', name: 'View Entries', description: 'View all entries and details.', checked: true, expanded: false },
        { key: 'entry.create', name: 'Create Entries', description: 'Create new entries in the system.', checked: true, expanded: false },
        { key: 'entry.edit', name: 'Edit Entries', description: 'Edit existing entries.', checked: true, expanded: false },
        { key: 'entry.delete', name: 'Delete Entries', description: 'Delete entries from the system.', checked: false, expanded: false },
        { key: 'entry.comment', name: 'Add Comments', description: 'Add comments to entries.', checked: true, expanded: false },
        { key: 'entry.attachments.view', name: 'View Attachments', description: 'View and download attachments.', checked: true, expanded: false },
      ],
    },
    {
      title: 'Review & Approval',
      permissions: [
        { key: 'entry.review', name: 'Review Entries', description: 'Review and approve entries.', checked: false, expanded: false },
        { key: 'entry.escalate', name: 'Escalate Entries', description: 'Escalate entries to other users.', checked: false, expanded: false },
      ],
    },
    {
      title: 'Reports & Export',
      permissions: [
        { key: 'report.view', name: 'View Reports', description: 'View system reports.', checked: false, expanded: false },
        { key: 'report.export', name: 'Export Data', description: 'Export entries and reports to file.', checked: false, expanded: false },
      ],
    },
  ];

  constructor(private router: Router) {}

  matches(permission: Permission): boolean {
    const q = this.search.trim().toLowerCase();
    if (!q) return true;
    return permission.name.toLowerCase().includes(q);
  }

  groupVisible(group: PermissionGroup): boolean {
    return group.permissions.some((p) => this.matches(p));
  }

  get hasResults(): boolean {
    return this.groups.some((g) => this.groupVisible(g));
  }

  toggleExpand(permission: Permission, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    permission.expanded = !permission.expanded;
  }

  get selectedPermissions(): string[] {
    return this.groups.flatMap((g) => g.permissions.filter((p) => p.checked).map((p) => p.key));
  }

  cancel(): void {
    this.router.navigate(['/user-management']);
  }

  saveRole(): void {
    // Wire up to the roles API when available.
    const payload = {
      name: this.roleName.trim(),
      description: this.roleDesc.trim(),
      active: this.status === 'active',
      permissions: this.selectedPermissions,
    };
    console.log('Save role', payload);
    this.router.navigate(['/user-management']);
  }
}
