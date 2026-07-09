import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EdobService } from '../../core/services/edob.service';
import { AuthService } from '../../core/services/auth.service';
import { AIGenerationService, AIMessage } from '../../core/services/ai-generation.service';
import { Entry, EntryType, Category, IncidentType, HandoverType } from '../../core/models/edob.models';

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

  // Common fields
  title = '';
  categoryId = '';
  priority = '';
  description = '';
  assignedToUserId = '';
  location = '';
  occurredAt = '';
  descriptionLength = 0;
  maxChars = 5000;

  // Validation errors
  titleError = '';
  categoryError = '';
  priorityError = '';
  descriptionError = '';
  occurredAtError = '';
  locationError = '';

  // Per-type attachment state (max 2 each)
  pdfFiles: SelectedFile[] = [];
  imageFiles: SelectedFile[] = [];
  audioFiles: SelectedFile[] = [];
  fileError = '';
  readonly maxFilesPerType = 2;
  readonly maxFileSize = 100 * 1024 * 1024;

  // Incident fields
  incidentTitle = '';
  incidentTypeId = '';
  incidentDate = '';
  incidentTime = '';
  peopleInvolved = '';
  incidentDescription = '';
  immediateActionsTaken = '';
  severityScore = '';
  incidentTitleError = '';
  incidentTypeError = '';
  incidentDateError = '';
  locationIncidentError = '';
  incidentDescriptionError = '';
  immediateActionsError = '';

  // Handover fields
  handoverTitle = '';
  handoverTypeId = '';
  handoverDateTime = '';
  handoverFrom = '';
  handoverTo = '';
  handoverLocation = '';
  operationalSummary = '';
  operationalSummaryLength = 0;
  outstandingIssues = '';
  outstandingActions = '';
  importantInfo = '';
  handoverTitleError = '';
  handoverTypeError = '';
  handoverDateTimeError = '';
  handoverFromError = '';
  handoverToError = '';
  operationalSummaryError = '';
  outstandingIssuesError = '';
  outstandingActionsError = '';
  importantInfoError = '';

  // Follow-Up fields
  followUpTitle = '';
  parentEntryId = '';
  followUpTitleError = '';
  parentEntryIdError = '';

  // API-loaded data
  entryTypes: EntryType[] = [];
  categories: Category[] = [];
  incidentTypes: IncidentType[] = [];
  handoverTypes: HandoverType[] = [];
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
    const sub = this.edobService.listCategories(orgId).subscribe({
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

    this.edobService.listIncidentTypes(orgId).subscribe({
      next: (types) => {
        const raw = types as any;
        let list: IncidentType[] = [];
        if (Array.isArray(raw)) list = raw;
        else if (raw && typeof raw === 'object') list = raw.data ?? raw.incidentTypes ?? raw.content ?? raw.items ?? [];
        this.incidentTypes = list.filter((t: IncidentType) => t.active);
      },
      error: (err) => console.error('Failed to load incident types', err),
    });

    this.edobService.listHandoverTypes(orgId).subscribe({
      next: (types) => {
        const raw = types as any;
        let list: HandoverType[] = [];
        if (Array.isArray(raw)) list = raw;
        else if (raw && typeof raw === 'object') list = raw.data ?? raw.handoverTypes ?? raw.content ?? raw.items ?? [];
        this.handoverTypes = list.filter((t: HandoverType) => t.active);
      },
      error: (err) => console.error('Failed to load handover types', err),
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
    this.handoverTitle = entry.title || '';
    this.followUpTitle = entry.title || '';
    this.categoryId = entry.categoryId || '';
    this.priority = entry.priority || '';
    this.description = entry.description || '';
    this.incidentDescription = entry.description || '';
    this.assignedToUserId = entry.assignedToUserId || '';
    this.occurredAt = entry.occurredAt ? entry.occurredAt.replace('Z', '').slice(0, 16) : '';

    const data = entry.data || {};
    this.location = data['location'] || '';
    this.incidentTypeId = entry.incidentTypeId || '';
    this.handoverTypeId = entry.handoverTypeId || '';
    this.peopleInvolved = Array.isArray(data['peopleInvolved']) ? data['peopleInvolved'].join(', ') : (data['peopleInvolved'] || '');
    this.immediateActionsTaken = data['immediateActionsTaken'] || '';
    this.severityScore = data['severityScore'] != null ? String(data['severityScore']) : '';
    this.incidentDate = data['incidentDate'] || '';
    this.incidentTime = data['incidentTime'] || '';
    this.handoverDateTime = data['shiftDateTime'] || data['handoverDateTime'] || '';
    this.handoverFrom = data['handoverFrom'] || '';
    this.handoverTo = data['handoverTo'] || '';
    this.handoverLocation = data['handoverLocation'] || '';
    this.outstandingIssues = Array.isArray(data['outstandingIssues']) ? data['outstandingIssues'].join('\n') : (data['outstandingIssues'] || '');
    this.outstandingActions = data['outstandingActions'] || '';
    this.importantInfo = data['importantInformation'] || '';
    this.operationalSummary = data['operationalSummary'] || entry.description || '';
    this.operationalSummaryLength = this.operationalSummary.length;
    this.descriptionLength = (this.description || '').length;
    this.parentEntryId = data['parentEntryId'] || '';
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
    this.clearErrors();
  }

  private clearErrors(): void {
    this.titleError = '';
    this.categoryError = '';
    this.priorityError = '';
    this.descriptionError = '';
    this.occurredAtError = '';
    this.locationError = '';
    this.incidentTitleError = '';
    this.incidentTypeError = '';
    this.incidentDateError = '';
    this.locationIncidentError = '';
    this.incidentDescriptionError = '';
    this.immediateActionsError = '';
    this.handoverTitleError = '';
    this.handoverTypeError = '';
    this.handoverDateTimeError = '';
    this.handoverFromError = '';
    this.handoverToError = '';
    this.operationalSummaryError = '';
    this.outstandingIssuesError = '';
    this.outstandingActionsError = '';
    this.importantInfoError = '';
    this.followUpTitleError = '';
    this.parentEntryIdError = '';
  }

  // ==================== Validations ====================

  private validateBasic(): boolean {
    this.clearErrors();
    let valid = true;

    if (!this.title.trim()) { this.titleError = 'Title is required'; valid = false; }
    if (!this.categoryId) { this.categoryError = 'Category is required'; valid = false; }
    if (!this.priority) { this.priorityError = 'Priority is required'; valid = false; }
    if (!this.description.trim()) { this.descriptionError = 'Description is required'; valid = false; }
    if (this.description.length > this.maxChars) { this.descriptionError = `Description must be under ${this.maxChars} characters`; valid = false; }

    return valid;
  }

  private validateIncident(): boolean {
    this.clearErrors();
    let valid = true;

    if (!this.incidentTitle.trim()) { this.incidentTitleError = 'Incident title is required'; valid = false; }
    if (!this.incidentTypeId) { this.incidentTypeError = 'Incident type is required'; valid = false; }
    if (!this.priority) { this.priorityError = 'Priority is required'; valid = false; }
    if (!this.occurredAt) { this.occurredAtError = 'Date and time are required'; valid = false; }
    if (!this.location.trim()) { this.locationIncidentError = 'Location is required'; valid = false; }
    if (!this.incidentDescription.trim()) { this.incidentDescriptionError = 'Description is required'; valid = false; }
    if (!this.immediateActionsTaken.trim()) { this.immediateActionsError = 'Immediate actions taken are required'; valid = false; }

    if (this.severityScore && (Number(this.severityScore) < 1 || Number(this.severityScore) > 10)) {
      this.immediateActionsError = 'Severity score must be between 1 and 10';
      valid = false;
    }

    return valid;
  }

  private validateHandover(): boolean {
    this.clearErrors();
    let valid = true;

    if (!this.handoverTitle.trim()) { this.handoverTitleError = 'Handover title is required'; valid = false; }
    if (!this.handoverTypeId) { this.handoverTypeError = 'Handover type is required'; valid = false; }
    if (!this.handoverDateTime) { this.handoverDateTimeError = 'Date and time are required'; valid = false; }
    if (!this.handoverFrom.trim()) { this.handoverFromError = 'Handover from is required'; valid = false; }
    if (!this.handoverTo.trim()) { this.handoverToError = 'Handover to is required'; valid = false; }
    if (!this.priority) { this.priorityError = 'Priority is required'; valid = false; }
    if (!this.operationalSummary.trim()) { this.operationalSummaryError = 'Operational summary is required'; valid = false; }
    if (this.operationalSummary.length > 5000) { this.operationalSummaryError = 'Operational summary must be under 5000 characters'; valid = false; }
    if (!this.outstandingIssues.trim()) { this.outstandingIssuesError = 'Outstanding issues are required'; valid = false; }
    if (!this.outstandingActions.trim()) { this.outstandingActionsError = 'Outstanding actions are required'; valid = false; }
    if (!this.importantInfo.trim()) { this.importantInfoError = 'Important information is required'; valid = false; }

    return valid;
  }

  private validateFollowUp(): boolean {
    this.clearErrors();
    let valid = true;

    if (!this.followUpTitle.trim()) { this.followUpTitleError = 'Title is required'; valid = false; }
    if (!this.priority) { this.priorityError = 'Priority is required'; valid = false; }
    if (!this.description.trim()) { this.descriptionError = 'Description is required'; valid = false; }

    return valid;
  }

  private validateForm(): boolean {
    switch (this.tabs[this.activeTab].entryTypeCode) {
      case 'BASIC': return this.validateBasic();
      case 'INCIDENT': return this.validateIncident();
      case 'HANDOVER': return this.validateHandover();
      case 'FOLLOW_UP': return this.validateFollowUp();
      default: return this.validateBasic();
    }
  }

  // ==================== Description handlers ====================

  onDescriptionInput(value: string): void {
    this.description = value;
    this.descriptionLength = value.length;
  }

  onOperationalSummaryInput(value: string): void {
    this.operationalSummary = value;
    this.operationalSummaryLength = value.length;
  }

  // ==================== File handlers ====================

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

  // ==================== Cancel / Category ====================

  onCancel(): void {
    this.title = '';
    this.categoryId = '';
    this.priority = '';
    this.description = '';
    this.assignedToUserId = '';
    this.location = '';
    this.occurredAt = '';
    this.descriptionLength = 0;
    this.clearFiles();
    this.fileError = '';
    this.errorMessage = '';
    this.incidentTitle = '';
    this.incidentTypeId = '';
    this.incidentDate = '';
    this.incidentTime = '';
    this.peopleInvolved = '';
    this.incidentDescription = '';
    this.immediateActionsTaken = '';
    this.severityScore = '';
    this.handoverTitle = '';
    this.handoverTypeId = '';
    this.handoverDateTime = '';
    this.handoverFrom = '';
    this.handoverTo = '';
    this.handoverLocation = '';
    this.operationalSummary = '';
    this.operationalSummaryLength = 0;
    this.outstandingIssues = '';
    this.outstandingActions = '';
    this.importantInfo = '';
    this.followUpTitle = '';
    this.parentEntryId = '';
    this.showCreateCategoryForm = false;
    this.newCategoryName = '';
    this.categoryCreateError = '';
    this.clearErrors();
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

  // ==================== Save / Submit ====================

  onSaveDraft(): void {
    if (!this.validateForm()) return;
    this.isSavingDraft = true;
    this.errorMessage = '';

    const formData = this.buildFormData();
    this.persistEntry(formData);
  }

  onSubmitEntry(): void {
    if (!this.validateForm()) return;
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

  // ==================== Payload builder ====================

  private buildFormData(): FormData {
    const entryPayload: any = {
      entryTypeCode: this.tabs[this.activeTab].entryTypeCode,
      priority: this.priority,
    };

    if (this.tabs[this.activeTab].entryTypeCode === 'BASIC') {
      entryPayload.title = this.title;
      entryPayload.description = this.description;
      if (this.categoryId) entryPayload.categoryId = this.categoryId;
      if (this.assignedToUserId) entryPayload.assignedToUserId = this.assignedToUserId;
    } else if (this.tabs[this.activeTab].entryTypeCode === 'INCIDENT') {
      entryPayload.title = this.incidentTitle;
      entryPayload.description = this.incidentDescription;
      if (this.categoryId) entryPayload.categoryId = this.categoryId;
      if (this.assignedToUserId) entryPayload.assignedToUserId = this.assignedToUserId;
      if (this.occurredAt) entryPayload.occurredAt = new Date(this.occurredAt).toISOString();
      entryPayload.incidentTypeId = this.incidentTypeId;
      if (this.location) entryPayload.location = this.location;

      const data: any = {};
      const peopleArr = this.peopleInvolved.split(',').map(s => s.trim()).filter(Boolean);
      if (peopleArr.length) data['peopleInvolved'] = peopleArr;
      if (this.immediateActionsTaken) data['immediateActionsTaken'] = this.immediateActionsTaken;
      if (this.severityScore) data['severityScore'] = Number(this.severityScore);
      entryPayload.data = data;
    } else if (this.tabs[this.activeTab].entryTypeCode === 'HANDOVER') {
      entryPayload.title = this.handoverTitle;
      entryPayload.description = this.operationalSummary;
      if (this.categoryId) entryPayload.categoryId = this.categoryId;
      if (this.assignedToUserId) entryPayload.assignedToUserId = this.assignedToUserId;
      if (this.occurredAt) entryPayload.occurredAt = new Date(this.handoverDateTime).toISOString();
      entryPayload.handoverTypeId = this.handoverTypeId;

      const data: any = {};
      if (this.handoverFrom) data['handoverFrom'] = this.handoverFrom;
      if (this.handoverTo) data['handoverTo'] = this.handoverTo;
      if (this.handoverLocation) data['handoverLocation'] = this.handoverLocation;
      const issuesArr = this.outstandingIssues.split('\n').map(s => s.trim()).filter(Boolean);
      if (issuesArr.length) data['outstandingIssues'] = issuesArr;
      data['outstandingActions'] = this.parseOutstandingActions(this.outstandingActions);
      if (this.importantInfo) data['importantInformation'] = this.importantInfo;
      entryPayload.data = data;
    } else if (this.tabs[this.activeTab].entryTypeCode === 'FOLLOW_UP') {
      entryPayload.title = this.followUpTitle;
      entryPayload.description = this.description;
      if (this.categoryId) entryPayload.categoryId = this.categoryId;
      if (this.assignedToUserId) entryPayload.assignedToUserId = this.assignedToUserId;
      if (this.occurredAt) entryPayload.occurredAt = new Date(this.occurredAt).toISOString();

      const data: any = {};
      if (this.parentEntryId) data['parentEntryId'] = this.parentEntryId;
      entryPayload.data = data;
    }

    const formData = new FormData();
    formData.append('entry', new Blob([JSON.stringify(entryPayload)], { type: 'application/json' }));

    for (const file of this.allFiles()) {
      formData.append('attachments', file);
    }

    return formData;
  }

  private parseOutstandingActions(raw: string): any[] {
    if (!raw.trim()) return [];
    return raw.split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => ({ task: line, done: false }));
  }

  // ==================== AI Generation ====================

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

    const entryTypeCode = this.tabs[this.activeTab].entryTypeCode as 'BASIC' | 'INCIDENT' | 'HANDOVER' | 'FOLLOW_UP';

    this.aiService.generateEntry(this.aiPrompt, history, categoryNames, priorityValues, entryTypeCode).subscribe({
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
      this.incidentTitle = parsed.title;
      this.handoverTitle = parsed.title;
      this.followUpTitle = parsed.title;
    }
    if (parsed.description) {
      this.description = parsed.description;
      this.descriptionLength = parsed.description.length;
      this.incidentDescription = parsed.description;
      this.operationalSummary = parsed.description;
      this.operationalSummaryLength = parsed.description.length;
    }
    if (parsed.priority) {
      const upper = String(parsed.priority).toUpperCase();
      const valid = this.priorities.find(p => p.value === upper);
      if (valid) this.priority = valid.value;
    }
    if (parsed.category) {
      const match = this.categories.find(c => c.name.toLowerCase() === String(parsed.category).toLowerCase());
      if (match) this.categoryId = match.id;
    }
    if (parsed.incidentType) {
      const match = this.incidentTypes.find(t => t.name.toLowerCase() === String(parsed.incidentType).toLowerCase());
      if (match) this.incidentTypeId = match.id;
    }
    if (parsed.handoverType) {
      const match = this.handoverTypes.find(t => t.name.toLowerCase() === String(parsed.handoverType).toLowerCase());
      if (match) this.handoverTypeId = match.id;
    }
    if (parsed.location) {
      this.location = parsed.location;
    }
    if (parsed.occurredAt) {
      this.occurredAt = parsed.occurredAt;
    }
    if (parsed.peopleInvolved) {
      this.peopleInvolved = Array.isArray(parsed.peopleInvolved) ? parsed.peopleInvolved.join(', ') : parsed.peopleInvolved;
    }
    if (parsed.immediateActionsTaken) {
      this.immediateActionsTaken = parsed.immediateActionsTaken;
    }
    if (parsed.severityScore != null) {
      this.severityScore = String(parsed.severityScore);
    }
    if (parsed.outstandingIssues) {
      this.outstandingIssues = Array.isArray(parsed.outstandingIssues) ? parsed.outstandingIssues.join('\n') : parsed.outstandingIssues;
    }
    if (parsed.outstandingActions) {
      if (Array.isArray(parsed.outstandingActions)) {
        this.outstandingActions = parsed.outstandingActions.map((a: any) => a.task || a).join('\n');
      } else {
        this.outstandingActions = parsed.outstandingActions;
      }
    }
    if (parsed.importantInformation) {
      this.importantInfo = parsed.importantInformation;
    }
    if (parsed.parentEntryId) {
      this.parentEntryId = parsed.parentEntryId;
    }
  }

  clearAiHistory(): void {
    this.aiHistory = [];
  }
}
