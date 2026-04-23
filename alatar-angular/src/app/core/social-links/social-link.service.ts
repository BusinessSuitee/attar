import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url.token';

export type SocialPlatform =
  | 'Facebook'
  | 'WhatsApp'
  | 'LinkedIn'
  | 'Instagram'
  | 'YouTube'
  | 'X'
  | 'TikTok'
  | 'Telegram'
  | 'Snapchat'
  | 'Pinterest'
  | 'Threads'
  | 'Reddit'
  | 'Discord'
  | 'Skype'
  | 'Viber'
  | 'WeChat'
  | 'Line'
  | 'Messenger'
  | 'Email'
  | 'Phone'
  | 'Website'
  | 'Location'
  | 'Custom';

export interface SocialLinkDto {
  id: string;
  platform: SocialPlatform;
  url: string;
  label: string;
  iconKey: string | null;
  customIconUrl: string | null;
  colorHex: string | null;
  displayOrder: number;
  isEnabled: boolean;
  opensInNewTab: boolean;
}

export interface CreateSocialLinkPayload {
  platform: SocialPlatform;
  url: string;
  label: string;
  iconKey: string | null;
  colorHex: string | null;
  opensInNewTab: boolean;
}

export type UpdateSocialLinkPayload = CreateSocialLinkPayload;

export interface SocialLinkIdResponse {
  id: string;
}

export interface IconUploadResponse {
  relativePath: string;
  url: string;
}

@Injectable({ providedIn: 'root' })
export class SocialLinkService {
  private readonly httpClient = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private get baseUrl(): string {
    return `${this.apiBaseUrl}/api/social-links`;
  }

  getPublic(): Observable<SocialLinkDto[]> {
    return this.httpClient.get<SocialLinkDto[]>(this.baseUrl);
  }

  getAll(): Observable<SocialLinkDto[]> {
    return this.httpClient.get<SocialLinkDto[]>(`${this.baseUrl}/all`);
  }

  create(payload: CreateSocialLinkPayload): Observable<SocialLinkIdResponse> {
    return this.httpClient.post<SocialLinkIdResponse>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateSocialLinkPayload): Observable<void> {
    return this.httpClient.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`);
  }

  toggle(id: string, isEnabled: boolean): Observable<void> {
    return this.httpClient.patch<void>(`${this.baseUrl}/${id}/toggle`, { isEnabled });
  }

  reorder(orderedIds: string[]): Observable<void> {
    return this.httpClient.put<void>(`${this.baseUrl}/reorder`, { orderedIds });
  }

  uploadIcon(id: string, file: File): Observable<IconUploadResponse> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.httpClient.post<IconUploadResponse>(`${this.baseUrl}/${id}/icon`, formData);
  }

  deleteIcon(id: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}/icon`);
  }
}
