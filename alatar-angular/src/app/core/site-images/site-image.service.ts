import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url.token';

export const SITE_IMAGE_ALBUMS = ['gallery', 'station-qtc', 'station-mha', 'station-attar', 'lands-album'] as const;
export const SITE_IMAGE_SLOTS = ['gallery-hero', 'stations-hero', 'lands-background', 'sorting', 'washing', 'packing', 'shipping'] as const;
export const SITE_IMAGE_PLACEMENTS = [...SITE_IMAGE_ALBUMS, ...SITE_IMAGE_SLOTS];
export type SiteImagePlacement = (typeof SITE_IMAGE_PLACEMENTS)[number];
export type SiteImageCategory = 'farms' | 'stations' | 'crops' | 'legacy';
export type SiteImageLanguage = 'ar' | 'en' | 'ru';
export interface SiteImageText { title: string; description: string; alt: string; }
export interface SiteImageMetadata {
  placement: SiteImagePlacement;
  category: SiteImageCategory | null;
  isEnabled: boolean;
  ar: SiteImageText;
  en: SiteImageText;
  ru: SiteImageText;
}
export interface SiteImageDto extends SiteImageMetadata {
  id: string;
  page: 'gallery' | 'stations';
  sourceKind: 'Asset' | 'External' | 'Upload';
  sourcePath: string;
  displayOrder: number;
}
export interface SiteImageView extends SiteImageDto { src: string; title: string; description: string; alt: string; }

export function siteImageText(image: SiteImageMetadata, language: string): SiteImageText {
  const text = image[language === 'en' || language === 'ru' ? language : 'ar'];
  const title = text.title || image.ar.title;
  return { title, description: text.description || image.ar.description, alt: text.alt || image.ar.alt || title };
}

export function validSiteImageFile(file: File): boolean {
  return file.size > 0 && file.size <= 5 * 1024 * 1024 && /\.(jpe?g|png|webp)$/i.test(file.name);
}

@Injectable({ providedIn: 'root' })
export class SiteImageService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_BASE_URL);
  private readonly base = `${this.api}/api/site-images`;
  getPublic(page: 'gallery' | 'stations'): Observable<SiteImageDto[]> {
    return this.http.get<SiteImageDto[]>(this.base, { params: { page }, transferCache: false });
  }
  getAll(): Observable<SiteImageDto[]> { return this.http.get<SiteImageDto[]>(`${this.base}/all`); }
  create(metadata: SiteImageMetadata, file: File): Observable<SiteImageDto> {
    const form = new FormData();
    form.append('metadata', JSON.stringify(metadata));
    form.append('file', file, file.name);
    return this.http.post<SiteImageDto>(this.base, form);
  }
  update(id: string, metadata: SiteImageMetadata): Observable<SiteImageDto> {
    return this.http.put<SiteImageDto>(`${this.base}/${id}`, metadata);
  }
  replace(id: string, file: File): Observable<SiteImageDto> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post<SiteImageDto>(`${this.base}/${id}/file`, form);
  }
  delete(id: string): Observable<void> { return this.http.delete<void>(`${this.base}/${id}`); }
  reorder(placement: SiteImagePlacement, orderedIds: string[]): Observable<void> {
    return this.http.put<void>(`${this.base}/reorder`, { placement, orderedIds });
  }
  url(image: SiteImageDto): string {
    return image.sourceKind === 'Upload' ? `${this.api.replace(/\/$/, '')}/${image.sourcePath.replace(/^\//, '')}` : image.sourcePath;
  }
}
