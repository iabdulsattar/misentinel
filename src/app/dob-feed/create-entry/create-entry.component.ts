import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EdobService } from '../../core/services/edob.service';
import { AuthService } from '../../core/services/auth.service';
import { AIGenerationService, AIMessage } from '../../core/services/ai-generation.service';
import { EntryType, Category } from '../../core/models/edob.models';

interface AIHistoryItem {
  prompt: string;
  result: string;
  timestamp: Date;
}

@Component({
  selector: 'app-create-entry',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './create-entry.component.html',
})
export class CreateEntryComponent implements OnInit {
  activeTab = 0;
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

  incidentTitle = '';
  incidentType = '';
  incidentDate = '';
  incidentTime = '';
  peopleInvolved = '';
  incidentDescription = '';
  immediateActionsTaken = '';

  // API-loaded data
  entryTypes: EntryType[] = [];
  categories: Category[] = [];
  isLoadingData = false;

  showCreateCategoryForm = false;
  newCategoryName = '';
  isCreatingCategory = false;
  categoryCreateError = '';

  priorities = [
    { value: 'LOW', label: 'Low' },
    { value: 'NORMAL', label: 'Normal' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'CRITICAL', label: 'Critical' },
  ];

  // AI drawer state
  aiDrawerOpen = false;
  aiPrompt = '';
  aiHistory: AIHistoryItem[] = [];
  isAiGenerating = false;
  aiError = '';

  constructor(
    private edobService: EdobService,
    private router: Router,
    private aiService: AIGenerationService
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
        let list: Category[] = [];

        if (Array.isArray(raw)) {
          list = raw;
        } else if (raw && typeof raw === 'object') {
          list = raw.data ?? raw.categories ?? raw.content ?? raw.items ?? [];
        }

        this.categories = list.filter((c: Category) => c.active);
        this.isLoadingData = false;
      },
      error: (err) => {
        console.error('Failed to load categories', err);
        this.isLoadingData = false;
      },
    });
  }

  private getOrgId(): string | null {
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      return localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
    }
    return sessionStorage.getItem('org_id') || sessionStorage.getItem('organizationId') || localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
  }

  setActiveTab(index: number): void {
    this.activeTab = index;
    this.showCreateCategoryForm = false;
    this.categoryCreateError = '';
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
    this.incidentTitle = '';
    this.incidentType = '';
    this.incidentDate = '';
    this.incidentTime = '';
    this.peopleInvolved = '';
    this.incidentDescription = '';
    this.immediateActionsTaken = '';
    this.showCreateCategoryForm = false;
    this.newCategoryName = '';
    this.categoryCreateError = '';
  }

  onCategoryChange(value: string): void {
    if (value === '__create_new__') {
      this.categoryId = '';
      this.showCreateCategoryForm = true;
    } else {
      this.categoryId = value;
      this.showCreateCategoryForm = false;
    }
    this.categoryCreateError = '';
  }

  createNewCategory(): void {
    const name = this.newCategoryName.trim();
    if (!name) return;

    this.isCreatingCategory = true;
    this.categoryCreateError = '';

    const orgId = this.getOrgId();
    if (!orgId) {
      this.categoryCreateError = 'Organization not found.';
      this.isCreatingCategory = false;
      return;
    }

    const code = name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '') || 'CATEGORY';
    this.edobService.createCategory(orgId, { code, name, active: true }).subscribe({
      next: (cat) => {
        this.categories = [...this.categories, cat];
        this.categoryId = cat.id;
        this.newCategoryName = '';
        this.showCreateCategoryForm = false;
        this.isCreatingCategory = false;
      },
      error: (err) => {
        this.categoryCreateError = err?.error?.message || 'Failed to create category.';
        this.isCreatingCategory = false;
      }
    });
  }

  onSaveDraft(): void {
    const hasBasic = this.title && this.categoryId && this.priority;
    const hasIncident = this.incidentTitle && this.incidentType && this.priority;
    if (!hasBasic && !hasIncident) return;
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
    const hasBasic = this.title && this.categoryId && this.priority;
    const hasIncident = this.incidentTitle && this.incidentType && this.priority;
    if (!hasBasic && !hasIncident) return;
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

    if (this.tabs[this.activeTab].entryTypeCode === 'INCIDENT') {
      if (this.incidentTitle) entryPayload['title'] = this.incidentTitle;
      if (this.incidentType) entryPayload['data'] = { ...(entryPayload['data'] || {}), incidentType: this.incidentType };
      if (this.incidentDate) entryPayload['data'] = { ...(entryPayload['data'] || {}), incidentDate: this.incidentDate };
      if (this.incidentTime) entryPayload['data'] = { ...(entryPayload['data'] || {}), incidentTime: this.incidentTime };
      if (this.peopleInvolved) entryPayload['data'] = { ...(entryPayload['data'] || {}), peopleInvolved: this.peopleInvolved };
      if (this.incidentDescription) entryPayload['description'] = this.incidentDescription;
      if (this.immediateActionsTaken) entryPayload['data'] = { ...(entryPayload['data'] || {}), immediateActionsTaken: this.immediateActionsTaken };
    }

    const formData = new FormData();
    formData.append('entry', new Blob([JSON.stringify(entryPayload)], { type: 'application/json' }));

    for (const file of this.attachments) {
      formData.append('attachments', file);
    }

    return formData;
  }

  toggleAiDrawer(): void {
    this.aiDrawerOpen = !this.aiDrawerOpen;
  }

  onGenerateEntry(): void {
    if (!this.aiPrompt.trim()) return;
    this.isAiGenerating = true;
    this.aiError = '';

    const history: AIMessage[] = this.aiHistory
      .slice(-6)
      .map(item => ({ role: 'user' as const, content: item.prompt }));

    const categoryNames = this.categories.map(c => c.name);
    const priorityValues = this.priorities.map(p => p.value);

    this.aiService.generateEntry(this.aiPrompt, history, categoryNames, priorityValues).subscribe({
      next: (res) => {
        const text = res?.content || '';
        this.aiHistory.unshift({
          prompt: this.aiPrompt,
          result: text,
          timestamp: new Date()
        });
        this.applyAiContent(text);
        this.aiPrompt = '';
        this.isAiGenerating = false;
      },
      error: (err) => {
        this.aiError = err?.error?.error?.message || err?.message || 'Failed to generate entry. Please try again.';
        this.isAiGenerating = false;
      }
    });
  }

  applyAiContent(text: string): void {
    let parsed: any = {};
    try {
      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { description: text };
    }

    if (parsed.title) {
      this.title = parsed.title;
    }
    if (parsed.description) {
      this.description = parsed.description;
      this.descriptionLength = parsed.description.length;
    }
    if (parsed.priority) {
      const upper = String(parsed.priority).toUpperCase();
      const valid = this.priorities.find(p => p.value === upper);
      if (valid) {
        this.priority = valid.value;
      }
    }
    if (parsed.category) {
      const match = this.categories.find(c => c.name.toLowerCase() === String(parsed.category).toLowerCase());
      if (match) {
        this.categoryId = match.id;
      }
    }
  }

  clearAiHistory(): void {
    this.aiHistory = [];
  }
}
