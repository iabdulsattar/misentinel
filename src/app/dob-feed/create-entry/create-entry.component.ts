import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EdobService } from '../../core/services/edob.service';
import { EntryType, Category } from '../../core/models/edob.models';

@Component({
  selector: 'app-create-entry',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './create-entry.component.html',
})
export class CreateEntryComponent implements OnInit {
  activeTab = 1;
  isSubmitting = false;
  isSavingDraft = false;
  errorMessage = '';

  tabs = [
    { id: 'basic', label: 'Basic Entry', icon: '✚', entryTypeCode: 'BASIC' },
    { id: 'incident', label: 'Incident', icon: '⚠️', entryTypeCode: 'INCIDENT' },
    { id: 'handover', label: 'Handover', icon: '👥', entryTypeCode: 'HANDOVER' },
    { id: 'followup', label: 'Follow-Up', icon: '✅', entryTypeCode: 'FOLLOW_UP' },
  ];

  // Form fields
  title = '';
  categoryId = '';
  priority = '';
  description = '';
  assignedToUserId = '';
  location = '';
  descriptionLength = 0;
  maxChars = 5000;
  attachments: File[] = [];

  // API-loaded data
  entryTypes: EntryType[] = [];
  categories: Category[] = [];
  isLoadingData = false;

  priorities = [
    { value: 'LOW', label: 'Low' },
    { value: 'NORMAL', label: 'Normal' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'CRITICAL', label: 'Critical' },
  ];

  constructor(
    private edobService: EdobService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFormData();
  }

  private loadFormData(): void {
    const orgId = this.getOrgId();
    if (!orgId) return;

    this.isLoadingData = true;
    this.edobService.listCategories(orgId).subscribe({
      next: (cats) => {
        const raw = cats as any;
        const list = Array.isArray(raw) ? raw : (raw?.data ?? raw?.categories ?? []);
        this.categories = list.filter((c: Category) => c.active);
        this.isLoadingData = false;
      },
      error: () => {
        this.isLoadingData = false;
      },
    });
  }

  private getOrgId(): string | null {
    return localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
  }

  setActiveTab(index: number): void {
    this.activeTab = index;
  }

  onDescriptionInput(value: string): void {
    this.description = value;
    this.descriptionLength = value.length;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.attachments = Array.from(input.files);
    }
  }

  removeAttachment(index: number): void {
    this.attachments.splice(index, 1);
  }

  onCancel(): void {
    this.title = '';
    this.categoryId = '';
    this.priority = '';
    this.description = '';
    this.assignedToUserId = '';
    this.location = '';
    this.descriptionLength = 0;
    this.attachments = [];
    this.errorMessage = '';
  }

  onSaveDraft(): void {
    if (!this.title) return;
    this.isSavingDraft = true;
    this.errorMessage = '';

    const orgId = this.getOrgId();
    if (!orgId) {
      this.errorMessage = 'Organization not found. Please sign in again.';
      this.isSavingDraft = false;
      return;
    }

    const formData = this.buildFormData();
    this.edobService.createEntry(orgId, formData).subscribe({
      next: () => {
        this.isSavingDraft = false;
        this.router.navigate(['/dob-feed']);
      },
      error: (err) => {
        this.isSavingDraft = false;
        this.errorMessage = err?.error?.message || 'Failed to save draft. Please try again.';
      },
    });
  }

  onSubmitEntry(): void {
    if (!this.title || !this.priority) return;
    this.isSubmitting = true;
    this.errorMessage = '';

    const orgId = this.getOrgId();
    if (!orgId) {
      this.errorMessage = 'Organization not found. Please sign in again.';
      this.isSubmitting = false;
      return;
    }

    const formData = this.buildFormData();
    this.edobService.createEntry(orgId, formData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/dob-feed']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err?.error?.message || 'Failed to create entry. Please try again.';
      },
    });
  }

  private buildFormData(): FormData {
    const entryPayload: any = {
      entryTypeCode: this.tabs[this.activeTab].entryTypeCode,
      priority: this.priority,
      title: this.title,
      description: this.description,
    };

    if (this.categoryId) entryPayload['categoryId'] = this.categoryId;
    if (this.assignedToUserId) entryPayload['assignedToUserId'] = this.assignedToUserId;
    if (this.location) {
      entryPayload['data'] = { location: this.location };
    }

    const formData = new FormData();
    formData.append('entry', new Blob([JSON.stringify(entryPayload)], { type: 'application/json' }));

    for (const file of this.attachments) {
      formData.append('attachments', file);
    }

    return formData;
  }
}