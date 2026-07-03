import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ApiWrapper } from '../models/auth.models';
import {
  EntryType,
  CreateEntryTypeRequest,
  UpdateEntryTypeRequest,
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  Entry,
  CreateEntryRequest,
  UpdateEntryRequest,
  ListEntriesRequest,
  ListEntriesResponse,
  EntryAttachment,
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignRolesRequest,
  OrgUser
} from '../models/edob.models';

@Injectable({ providedIn: 'root' })
export class EdobService {
  constructor(private api: ApiService) {}

  private basePath(orgId: string) {
    return `/api/v1/edob/organizations/${orgId}`;
  }

  // ==================== Entry Types ====================

  // GET /api/v1/edob/organizations/{orgId}/entry-types
  listEntryTypes(orgId: string): Observable<EntryType[]> {
    return this.api.get<ApiWrapper<EntryType[]>>(`${this.basePath(orgId)}/entry-types`).pipe(map(res => res.data));
  }

  // POST /api/v1/edob/organizations/{orgId}/entry-types (admin)
  createEntryType(orgId: string, payload: CreateEntryTypeRequest): Observable<EntryType> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post<EntryType>(`${this.basePath(orgId)}/entry-types`, payload, headers);
  }

  // PUT /api/v1/edob/organizations/{orgId}/entry-types/{entryTypeId}
  updateEntryType(orgId: string, entryTypeId: string, payload: UpdateEntryTypeRequest): Observable<EntryType> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.put<EntryType>(`${this.basePath(orgId)}/entry-types/${entryTypeId}`, payload, headers);
  }

  // DELETE /api/v1/edob/organizations/{orgId}/entry-types/{entryTypeId}
  disableEntryType(orgId: string, entryTypeId: string): Observable<any> {
    return this.api.delete(`${this.basePath(orgId)}/entry-types/${entryTypeId}`);
  }

  // ==================== Categories ====================

  // GET /api/v1/edob/organizations/{orgId}/categories
  listCategories(orgId: string): Observable<Category[]> {
    return this.api.get<ApiWrapper<Category[]>>(`${this.basePath(orgId)}/categories`).pipe(map(res => res.data));
  }

  // POST /api/v1/edob/organizations/{orgId}/categories
  createCategory(orgId: string, payload: CreateCategoryRequest): Observable<Category> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post<Category>(`${this.basePath(orgId)}/categories`, payload, headers);
  }

  // PUT /api/v1/edob/organizations/{orgId}/categories/{categoryId}
  updateCategory(orgId: string, categoryId: string, payload: UpdateCategoryRequest): Observable<Category> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.put<Category>(`${this.basePath(orgId)}/categories/${categoryId}`, payload, headers);
  }

  // DELETE /api/v1/edob/organizations/{orgId}/categories/{categoryId}
  disableCategory(orgId: string, categoryId: string): Observable<any> {
    return this.api.delete(`${this.basePath(orgId)}/categories/${categoryId}`);
  }

  // ==================== Entries ====================

  // POST /api/v1/edob/organizations/{orgId}/entries (multipart: entry JSON + attachments)
  createEntry(orgId: string, formData: FormData): Observable<Entry> {
    // No Content-Type header — browser sets multipart boundary automatically
    return this.api.post<Entry>(`${this.basePath(orgId)}/entries`, formData);
  }

  // GET /api/v1/edob/organizations/{orgId}/entries
  listEntries(orgId: string, filters?: ListEntriesRequest): Observable<ListEntriesResponse> {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.page !== undefined) params.set('page', String(filters.page));
      if (filters.size !== undefined) params.set('size', String(filters.size));
      if (filters.typeId) params.set('typeId', filters.typeId);
      if (filters.status) params.set('status', filters.status);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.assignedTo) params.set('assignedTo', filters.assignedTo);
      if (filters.createdBy) params.set('createdBy', filters.createdBy);
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);
      if (filters.search) params.set('search', filters.search);
    }
    const qs = params.toString();
    return this.api.get<ApiWrapper<any>>(`${this.basePath(orgId)}/entries${qs ? `?${qs}` : ''}`).pipe(
      map(res => ({
        entries: res.data,
        total: res.meta.totalElements,
        page: res.meta.page,
        size: res.meta.size
      }))
    );
  }

  // GET /api/v1/edob/organizations/{orgId}/entries/{entryId}
  getEntry(orgId: string, entryId: string): Observable<Entry> {
    return this.api.get<Entry>(`${this.basePath(orgId)}/entries/${entryId}`);
  }

  // PATCH /api/v1/edob/organizations/{orgId}/entries/{entryId} (multipart)
  updateEntry(orgId: string, entryId: string, formData: FormData): Observable<Entry> {
    return this.api.patch<Entry>(`${this.basePath(orgId)}/entries/${entryId}`, formData);
  }

  // ==================== Attachments ====================

  // GET /api/v1/edob/organizations/{orgId}/entries/{entryId}/attachments
  listAttachments(orgId: string, entryId: string): Observable<EntryAttachment[]> {
    return this.api.get<EntryAttachment[]>(`${this.basePath(orgId)}/entries/${entryId}/attachments`);
  }

  // GET /api/v1/edob/organizations/{orgId}/entries/{entryId}/attachments/{attachmentId}/download
  downloadAttachment(orgId: string, entryId: string, attachmentId: string): Observable<Blob> {
    return this.api.get<Blob>(`${this.basePath(orgId)}/entries/${entryId}/attachments/${attachmentId}/download`);
  }

  // DELETE /api/v1/edob/organizations/{orgId}/entries/{entryId}/attachments/{attachmentId}
  deleteAttachment(orgId: string, entryId: string, attachmentId: string): Observable<any> {
    return this.api.delete(`${this.basePath(orgId)}/entries/${entryId}/attachments/${attachmentId}`);
  }

  // ==================== Roles ====================

  // GET /api/v1/edob/organizations/{orgId}/roles
  listRoles(orgId: string): Observable<Role[]> {
    return this.api.get<Role[]>(`${this.basePath(orgId)}/roles`);
  }

  // POST /api/v1/edob/organizations/{orgId}/roles
  createRole(orgId: string, payload: CreateRoleRequest): Observable<Role> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post<Role>(`${this.basePath(orgId)}/roles`, payload, headers);
  }

  // PUT /api/v1/edob/organizations/{orgId}/roles/{roleId}
  updateRole(orgId: string, roleId: string, payload: UpdateRoleRequest): Observable<Role> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.put<Role>(`${this.basePath(orgId)}/roles/${roleId}`, payload, headers);
  }

  // PUT /api/v1/edob/organizations/{orgId}/users/{userId}/roles
  assignRolesToUser(orgId: string, userId: string, payload: AssignRolesRequest): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.put(`${this.basePath(orgId)}/users/${userId}/roles`, payload, headers);
  }

  // ==================== Users ====================

  // GET /api/v1/edob/organizations/{orgId}/users
  listOrgUsers(orgId: string): Observable<OrgUser[]> {
    return this.api.get<ApiWrapper<OrgUser[]>>(`${this.basePath(orgId)}/users`).pipe(map(res => res.data));
  }

  // GET /api/v1/edob/organizations/{orgId}/users/{userId}
  getOrgUser(orgId: string, userId: string): Observable<OrgUser> {
    return this.api.get<OrgUser>(`${this.basePath(orgId)}/users/${userId}`);
  }
}