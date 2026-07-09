import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { EdobService } from '../../core/services/edob.service';
import { Entry } from '../../core/models/edob.models';

@Component({
  selector: 'app-entry-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './entry-detail.component.html',
  styles: ``
})
export class EntryDetailComponent implements OnInit {
  entry: Entry | null = null;
  loading = true;
  errorMessage = '';

  private categoryMap = new Map<string, string>();
  private userMap = new Map<string, string>();

  constructor(
    private edobService: EdobService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'Entry not found.';
      this.loading = false;
      return;
    }
    this.loadEntry(id);
  }

  private loadEntry(id: string): void {
    const orgId = this.getOrgId();
    if (!orgId) {
      this.errorMessage = 'Organization not found. Please sign in again.';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.edobService.getEntry(orgId, id).subscribe({
      next: (data: Entry) => {
        this.entry = data;
        this.loading = false;
        this.loadLookups(orgId);
      },
      error: () => {
        this.errorMessage = 'Failed to load entry. Please try again.';
        this.loading = false;
      }
    });
  }

  private loadLookups(orgId: string): void {
    this.edobService.listCategories(orgId).subscribe({
      next: (cats) => {
        this.categoryMap = new Map(cats.map(c => [c.id, c.name]));
      },
      error: () => {}
    });

    this.edobService.listOrgUsers(orgId).subscribe({
      next: (users) => {
        this.userMap = new Map(users.map(u => [u.id, `${u.firstName} ${u.lastName}`.trim() || u.email]));
      },
      error: () => {}
    });
  }

  goBack(): void {
    this.router.navigate(['/entries']);
  }

  formatDateTime(iso: string): string {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  get createdByUserName(): string {
    if (!this.entry?.createdByUserId) return '-';
    return this.userMap.get(this.entry.createdByUserId) || this.entry.createdByUserId;
  }

  get typeName(): string {
    if (!this.entry) return '-';
    const map: Record<string, string> = { BASIC: 'Basic Entry', INCIDENT: 'Incident', HANDOVER: 'Handover', FOLLOW_UP: 'Follow-Up' };
    return map[this.entry.entryTypeCode] || this.entry.entryTypeCode;
  }

  get categoryName(): string {
    if (!this.entry?.categoryId) return '-';
    return this.categoryMap.get(this.entry.categoryId) || this.entry.categoryId;
  }

  get priorityClass(): string {
    if (!this.entry) return '';
    const map: Record<string, string> = {
      LOW: 'bg-gray-50 text-gray-700',
      NORMAL: 'bg-blue-50 text-blue-700',
      MEDIUM: 'bg-yellow-50 text-yellow-700',
      HIGH: 'bg-red-50 text-red-600',
      CRITICAL: 'bg-red-50 text-red-600',
    };
    return map[this.entry.priority] || 'bg-gray-50 text-gray-700';
  }

  get priorityLabel(): string {
    if (!this.entry) return '';
    return this.entry.priority.charAt(0) + this.entry.priority.slice(1).toLowerCase();
  }

  getAttachmentIcon(att: any): string {
    const kind = (att.kind || '').toUpperCase();
    if (kind === 'PHOTO' || att.type === 'image') return 'ti-photo';
    if (kind === 'AUDIO' || att.type === 'audio') return 'ti-microphone';
    if (att.contentType === 'application/pdf' || att.type === 'document') return 'ti-file-type-pdf';
    return 'ti-file';
  }

  getAttachmentColor(att: any): string {
    const kind = (att.kind || '').toUpperCase();
    if (kind === 'PHOTO' || att.type === 'image') return 'text-green-600';
    if (kind === 'AUDIO' || att.type === 'audio') return 'text-indigo-500';
    if (att.contentType === 'application/pdf' || att.type === 'document') return 'text-red-500';
    return 'text-slate-600';
  }

  getAttachmentBg(att: any): string {
    const kind = (att.kind || '').toUpperCase();
    if (kind === 'PHOTO' || att.type === 'image') return 'bg-green-50';
    if (kind === 'AUDIO' || att.type === 'audio') return 'bg-indigo-50';
    if (att.contentType === 'application/pdf' || att.type === 'document') return 'bg-red-50';
    return 'bg-slate-50';
  }

  private getOrgId(): string | null {
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      return localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
    }
    return sessionStorage.getItem('org_id') || sessionStorage.getItem('organizationId') || localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
  }
}
