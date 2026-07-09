import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EdobService } from '../../core/services/edob.service';
import { AuthService } from '../../core/services/auth.service';
import { AIGenerationService, AIMessage } from '../../core/services/ai-generation.service';
import { Entry, EntryType, Category } from '../../core/models/edob.models';

interface AIHistoryItem {
  prompt: string;
  result: string;
  timestamp: Date;
}

interface SelectedFile {
  file: File;
  previewUrl?: string;
}

type AttachmentType = 'pdf' | 'image' | 'audio';

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
  isLoadingEntry = false;
  errorMessage = '';

  editMode = false;
  editEntryId: string | null = null;

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

  // Per-type attachment state (max 2 each)
  pdfFiles: SelectedFile[] = [];
  imageFiles: SelectedFile[] = [];
  audioFiles: SelectedFile[] = [];
  fileError = '';
  readonly maxFilesPerType = 2;
  readonly maxFileSize = 100 * 1024 * 1024;

  incidentTitle = '';
  incidentType = '';
  incidentDate = '';
  incidentTime = '';
  peopleInvolved = '';
  incidentDescription = '';
  immediateActionsTaken = '';

  // Handover fields
  handoverTitle = '';
  handoverType = '';
  handoverDateTime = '';
  handoverFrom = '';
  handoverTo = '';
  handoverLocation = '';
  operationalSummary = '';
  operationalSummaryLength = 0;
  outstandingIssues = '';
  outstandingActions = '';
  importantInfo = '';

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
    private route: ActivatedRoute,
    private aiService: AIGenerationService
  ) {}

  ngOnInit(): void {
    const entryId = this.route.snapshot.queryParamMap.get('id');
    if (entryId) {
      this.editMode = true;
      this.editEntryId = entryId;
      this.loadEntryForEdit(entryId);
    }
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

  private loadEntryForEdit(entryId: string): void {
    const orgId = this.getOrgId();
    if (!orgId) return;

    this.isLoadingEntry = true;
    this.edobService.getEntry(orgId, entryId).subscribe({
      next: (entry: Entry) => {
        this.prefillForm(entry);
        this.isLoadingEntry = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load entry.';
        this.isLoadingEntry = false;
      }
    });
  }

  private prefillForm(entry: Entry): void {
    const typeIndexMap: Record<string, number> = { BASIC: 0, INCIDENT: 1, HANDOVER: 2, FOLLOW_UP: 3 };
    this.activeTab = typeIndexMap[entry.entryTypeCode] ?? 0;
    this.title = entry.title || '';
    this.incidentTitle = entry.title || '';
    this.categoryId = entry.categoryId || '';
    this.priority = entry.priority || '';
    this.description = entry.description || '';
    this.incidentDescription = entry.description || '';
    this.assignedToUserId = entry.assignedToUserId || '';

    const data = entry.data || {};
    this.location = data['location'] || '';
    this.incidentType = data['incidentType'] || '';
    this.incidentDate = data['incidentDate'] || '';
    this.incidentTime = data['incidentTime'] || '';
    this.peopleInvolved = data['peopleInvolved'] || '';
    this.immediateActionsTaken = data['immediateActionsTaken'] || '';
    this.handoverType = data['handoverType'] || '';
    this.handoverDateTime = data['shiftDateTime'] || '';
    this.handoverFrom = data['handoverFrom'] || '';
    this.handoverTo = data['handoverTo'] || '';
    this.handoverLocation = data['handoverLocation'] || '';
    this.outstandingIssues = data['outstandingIssues'] || '';
    this.outstandingActions = data['outstandingActions'] || '';
    this.importantInfo = data['importantInformation'] || '';
    this.operationalSummary = entry.description || '';
    this.operationalSummaryLength = this.operationalSummary.length;
    this.descriptionLength = this.description.length;
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

  onOperationalSummaryInput(value: string): void {
    this.operationalSummary = value;
    this.operationalSummaryLength = value.length;
  }

  onFileSelected(event: Event, type: AttachmentType): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const list = this.getFileList(type);
    const remaining = this.maxFilesPerType - list.length;
    if (remaining <= 0) {
      this.fileError = `You can attach a maximum of ${this.maxFilesPerType} ${type} file(s).`;
      input.value = '';
      return;
    }

    const incoming = Array.from(input.files).slice(0, remaining);
    for (const file of incoming) {
      if (!this.validateFile(file, type)) continue;
      const item: SelectedFile = { file };
      if ((type === 'image' || type === 'audio') && file.type.startsWith(type + '/')) {
        item.previewUrl = URL.createObjectURL(file);
      }
      list.push(item);
    }

    this.fileError = '';
    input.value = '';
  }

  private validateFile(file: File, type: AttachmentType): boolean {
    if (file.size > this.maxFileSize) {
      this.fileError = `"${file.name}" exceeds the 100MB limit.`;
      return false;
    }
    if (!this.acceptsType(file, type)) {
      this.fileError = `"${file.name}" is not a valid ${type} file.`;
      return false;
    }
    return true;
  }

  private acceptsType(file: File, type: AttachmentType): boolean {
    const name = file.name.toLowerCase();
    if (type === 'pdf') {
      return file.type === 'application/pdf' || name.endsWith('.pdf');
    }
    if (type === 'image') {
      return file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp)$/.test(name);
    }
    return file.type.startsWith('audio/') || /\.(mp3|m4a|wav|ogg|aac|flac)$/.test(name);
  }

  private getFileList(type: AttachmentType): SelectedFile[] {
    switch (type) {
      case 'pdf': return this.pdfFiles;
      case 'image': return this.imageFiles;
      case 'audio': return this.audioFiles;
    }
  }

  removeFile(type: AttachmentType, index: number): void {
    const list = this.getFileList(type);
    const item = list[index];
    if (item?.previewUrl) {
      URL.revokeObjectURL(item.previewUrl);
    }
    list.splice(index, 1);
    this.fileError = '';
  }

  clearFiles(): void {
    for (const list of [this.pdfFiles, this.imageFiles, this.audioFiles]) {
      for (const item of list) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      }
      list.length = 0;
    }
  }

  allFiles(): File[] {
    return [...this.pdfFiles, ...this.imageFiles, ...this.audioFiles].map(i => i.file);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  onCancel(): void {
    this.title = '';
    this.categoryId = '';
    this.priority = '';
    this.description = '';
    this.assignedToUserId = '';
    this.location = '';
    this.descriptionLength = 0;
    this.clearFiles();
    this.fileError = '';
    this.errorMessage = '';
    this.incidentTitle = '';
    this.incidentType = '';
    this.incidentDate = '';
    this.incidentTime = '';
    this.peopleInvolved = '';
    this.incidentDescription = '';
    this.immediateActionsTaken = '';
    this.handoverTitle = '';
    this.handoverType = '';
    this.handoverDateTime = '';
    this.handoverFrom = '';
    this.handoverTo = '';
    this.handoverLocation = '';
    this.operationalSummary = '';
    this.operationalSummaryLength = 0;
    this.outstandingIssues = '';
    this.outstandingActions = '';
    this.importantInfo = '';
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
    const hasHandover = this.handoverTitle && this.priority;
    if (!hasBasic && !hasIncident && !hasHandover) return;
    this.isSavingDraft = true;
    this.errorMessage = '';

    const formData = this.buildFormData();
    this.persistEntry(formData);
  }

  onSubmitEntry(): void {
    const hasBasic = this.title && this.categoryId && this.priority;
    const hasIncident = this.incidentTitle && this.incidentType && this.priority;
    const hasHandover = this.handoverTitle && this.priority;
    if (!hasBasic && !hasIncident && !hasHandover) return;
    this.isSubmitting = true;
    this.errorMessage = '';

    const formData = this.buildFormData();
    this.persistEntry(formData);
  }

  private persistEntry(formData: FormData): void {
    const orgId = this.getOrgId();
    if (!orgId) {
      this.errorMessage = 'Organization not found. Please sign in again.';
      this.isSubmitting = false;
      this.isSavingDraft = false;
      return;
    }

    const done = () => {
      this.isSubmitting = false;
      this.isSavingDraft = false;
      this.router.navigate(['/entries']);
    };
    const fail = (err: any) => {
      this.isSubmitting = false;
      this.isSavingDraft = false;
      this.errorMessage = err?.error?.message || 'Failed to save entry. Please try again.';
    };

    if (this.editMode && this.editEntryId) {
      this.edobService.updateEntry(orgId, this.editEntryId, formData).subscribe({ next: done, error: fail });
    } else {
      this.edobService.createEntry(orgId, formData).subscribe({ next: done, error: fail });
    }
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

    if (this.tabs[this.activeTab].entryTypeCode === 'INCIDENT') {
      if (this.incidentTitle) entryPayload['title'] = this.incidentTitle;
      if (this.incidentType) entryPayload['data'] = { ...(entryPayload['data'] || {}), incidentType: this.incidentType };
      if (this.incidentDate) entryPayload['data'] = { ...(entryPayload['data'] || {}), incidentDate: this.incidentDate };
      if (this.incidentTime) entryPayload['data'] = { ...(entryPayload['data'] || {}), incidentTime: this.incidentTime };
      if (this.peopleInvolved) entryPayload['data'] = { ...(entryPayload['data'] || {}), peopleInvolved: this.peopleInvolved };
      if (this.incidentDescription) entryPayload['description'] = this.incidentDescription;
      if (this.immediateActionsTaken) entryPayload['data'] = { ...(entryPayload['data'] || {}), immediateActionsTaken: this.immediateActionsTaken };
    } else if (this.tabs[this.activeTab].entryTypeCode === 'HANDOVER') {
      if (this.handoverTitle) entryPayload['title'] = this.handoverTitle;
      if (this.operationalSummary) entryPayload['description'] = this.operationalSummary;
      const data: Record<string, any> = {};
      if (this.handoverType) data['handoverType'] = this.handoverType;
      if (this.handoverDateTime) data['shiftDateTime'] = this.handoverDateTime;
      if (this.handoverFrom) data['handoverFrom'] = this.handoverFrom;
      if (this.handoverTo) data['handoverTo'] = this.handoverTo;
      if (this.handoverLocation) data['handoverLocation'] = this.handoverLocation;
      if (this.outstandingIssues) data['outstandingIssues'] = this.outstandingIssues;
      if (this.outstandingActions) data['outstandingActions'] = this.outstandingActions;
      if (this.importantInfo) data['importantInformation'] = this.importantInfo;
      entryPayload['data'] = data;
    }

    const formData = new FormData();
    formData.append('entry', new Blob([JSON.stringify(entryPayload)], { type: 'application/json' }));

    for (const file of this.allFiles()) {
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

    if (this.tabs[this.activeTab].entryTypeCode === 'HANDOVER') {
      if (parsed.title) this.handoverTitle = parsed.title;
      if (parsed.description) {
        this.operationalSummary = parsed.description;
        this.operationalSummaryLength = parsed.description.length;
      }
    }
  }

  clearAiHistory(): void {
    this.aiHistory = [];
  }
}
