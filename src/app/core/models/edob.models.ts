// -------- Entry Types --------
export interface EntryType {
  id: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  requiredFields?: string[];
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface CreateEntryTypeRequest {
  code: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
  requiredFields?: string[];
  active?: boolean;
}

export interface UpdateEntryTypeRequest {
  code?: string;
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
  requiredFields?: string[];
  active?: boolean;
}

// -------- Incident Types --------
export interface IncidentType {
  id: string;
  code: string;
  name: string;
  description?: string;
  color?: string;
  sortOrder: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface CreateIncidentTypeRequest {
  code: string;
  name: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  active?: boolean;
}

export interface UpdateIncidentTypeRequest {
  code?: string;
  name?: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  active?: boolean;
}

// -------- Handover Types --------
export interface HandoverType {
  id: string;
  code: string;
  name: string;
  description?: string;
  color?: string;
  sortOrder: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface CreateHandoverTypeRequest {
  code: string;
  name: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  active?: boolean;
}

export interface UpdateHandoverTypeRequest {
  code?: string;
  name?: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  active?: boolean;
}

// -------- Categories --------
export interface Category {
  id: string;
  code: string;
  name: string;
  color?: string;
  sortOrder: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface CreateCategoryRequest {
  code: string;
  name: string;
  color?: string;
  sortOrder?: number;
  active?: boolean;
}

export interface UpdateCategoryRequest {
  code?: string;
  name?: string;
  color?: string;
  sortOrder?: number;
  active?: boolean;
}

// -------- Entries --------
export type EntryStatus = 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'ASSIGNED' | 'CANCELLED';
export type EntryPriority = 'LOW' | 'NORMAL' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Entry {
  id: string;
  entryNumber?: string;
  organizationId: string;
  entryTypeCode: string;
  entryTypeId?: string;
  categoryId?: string;
  status: EntryStatus;
  priority: EntryPriority;
  title: string;
  description?: string;
  data?: Record<string, any>;
  assignedToUserId?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  attachments?: EntryAttachment[];
  occurredAt?: string;
  incidentTypeId?: string;
  handoverTypeId?: string;
  location?: string;
  [key: string]: any;
}

export interface CreateEntryRequest {
  entryTypeCode: string;
  categoryId?: string;
  priority?: EntryPriority;
  status?: EntryStatus;
  title: string;
  description?: string;
  assignedToUserId?: string;
  data?: Record<string, any>;
  occurredAt?: string;
  incidentTypeId?: string;
  handoverTypeId?: string;
  location?: string;
}

export interface UpdateEntryRequest {
  entryTypeCode?: string;
  categoryId?: string;
  status?: EntryStatus;
  priority?: EntryPriority;
  title?: string;
  description?: string;
  assignedToUserId?: string;
  data?: Record<string, any>;
  occurredAt?: string;
  incidentTypeId?: string;
  handoverTypeId?: string;
  location?: string;
}

export interface ListEntriesRequest {
  page?: number;
  size?: number;
  typeId?: string;
  status?: EntryStatus;
  priority?: EntryPriority;
  assignedTo?: string;
  createdBy?: string;
  from?: string;
  to?: string;
  search?: string;
}

export interface ListEntriesResponse {
  entries: Entry[];
  total: number;
  page: number;
  size: number;
  [key: string]: any;
}

// -------- Attachments --------
export interface EntryAttachment {
  id: string;
  entryId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  type: 'image' | 'audio' | 'video' | 'document' | 'other';
  createdAt: string;
  url?: string;
  [key: string]: any;
}

// -------- Roles --------
export interface Role {
  id: string;
  code: string;
  name: string;
  description?: string;
  permissions: string[];
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface CreateRoleRequest {
  code: string;
  name: string;
  description?: string;
  permissions: string[];
  active?: boolean;
}

export interface UpdateRoleRequest {
  code?: string;
  name?: string;
  description?: string;
  permissions?: string[];
  active?: boolean;
}

export interface AssignRolesRequest {
  roleIds: string[];
}

// -------- Org Users --------
export interface OrgUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  roles?: Role[];
  [key: string]: any;
}

// -------- Comments --------
export interface Comment {
  id: string;
  entryId: string;
  authorUserId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  body: string;
  editedAt: string | null;
  createdAt: string;
  user?: string;
  role?: string;
  time?: string;
  img?: number;
  [key: string]: any;
}