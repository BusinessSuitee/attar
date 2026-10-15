import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BehaviorSubject } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../config/api-base-url.token';
import { PublicSiteImagesStore } from './public-site-images.store';
import { SiteImageDto, SiteImageService, siteImageText, validSiteImageFile } from './site-image.service';
import { GalleryPageComponent } from '../../pages/gallery/gallery.page';

const image = (changes: Partial<SiteImageDto> = {}): SiteImageDto => ({
  id: 'one', page: 'gallery', placement: 'gallery', category: 'farms', isEnabled: true,
  sourceKind: 'Asset', sourcePath: 'assets/Images/مزارع 1.jpeg', displayOrder: 0,
  ar: { title: 'مزرعة', description: 'وصف', alt: '' }, en: { title: '', description: '', alt: '' }, ru: { title: '', description: '', alt: '' }, ...changes,
});

describe('managed site images', () => {
  let http: HttpTestingController;
  let store: PublicSiteImagesStore;
  let language: BehaviorSubject<string>;
  beforeEach(() => {
    language = new BehaviorSubject('ar');
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), PublicSiteImagesStore,
      { provide: API_BASE_URL, useValue: 'https://test.invalid' },
      { provide: TranslocoService, useValue: { langChanges$: language, getActiveLang: () => 'ar' } },
    ] });
    http = TestBed.inject(HttpTestingController); store = TestBed.inject(PublicSiteImagesStore);
  });
  afterEach(() => { http.verify(); document.body.style.overflow = ''; TestBed.resetTestingModule(); });

  it('treats an empty successful response as empty, without restoring legacy images', () => {
    store.load('gallery');
    const req = http.expectOne('https://test.invalid/api/site-images?page=gallery');
    expect(req.request.transferCache).toBe(false);
    req.flush([]);
    expect(store.images()).toEqual([]); expect(store.background('gallery-hero')).toBeNull(); expect(store.error()).toBe(false);
  });
  it('can retry a failed request and uses localized captions and the correct source origin', () => {
    store.load('gallery'); http.expectOne('https://test.invalid/api/site-images?page=gallery').error(new ProgressEvent('error'));
    expect(store.error()).toBe(true); expect(store.images()).toEqual([]);
    store.load('gallery'); http.expectOne('https://test.invalid/api/site-images?page=gallery').flush([
      image({ en: { title: 'Farm', description: '', alt: 'Orchard' } }),
      image({ id: 'two', sourceKind: 'Upload', sourcePath: 'uploads/site-images/new.png', displayOrder: 1 }),
    ]);
    language.next('en');
    expect(store.error()).toBe(false); expect(store.album('gallery')[0].title).toBe('Farm');
    expect(store.album('gallery')[0].src).toBe('assets/Images/مزارع 1.jpeg');
    expect(store.album('gallery')[1].src).toBe('https://test.invalid/uploads/site-images/new.png');
    language.next('ru'); expect(store.album('gallery')[0].title).toBe('مزرعة');
  });
  it('keeps filters and lightbox navigation working and restores body scrolling', () => {
    const gallery = TestBed.runInInjectionContext(() => new GalleryPageComponent());
    gallery.ngOnInit();
    http.expectOne('https://test.invalid/api/site-images?page=gallery').flush([
      image(), image({ id: 'two', category: 'stations', displayOrder: 1 }),
    ]);
    gallery.openImage(0); expect(document.body.style.overflow).toBe('hidden');
    gallery.nextImage(new Event('click')); expect(gallery.currentSelectedImage()?.id).toBe('two');
    gallery.nextImage(new Event('click')); expect(gallery.currentSelectedImage()?.id).toBe('one');
    gallery.setFilter('stations'); expect(document.body.style.overflow).toBe(''); expect(gallery.visibleItems()).toHaveLength(1);
    gallery.openImage(0); gallery.ngOnDestroy(); expect(document.body.style.overflow).toBe('');
  });
  it('uploads multipart data and preserves source distinctions', () => {
    const service = TestBed.inject(SiteImageService);
    service.create(image(), new File(['png'], 'image.png')).subscribe();
    const req = http.expectOne('https://test.invalid/api/site-images');
    expect(req.request.body.get('file').name).toBe('image.png');
    expect(JSON.parse(req.request.body.get('metadata')).placement).toBe('gallery'); req.flush(image());
    expect(service.url(image({ sourceKind: 'External', sourcePath: 'https://images.invalid/example.jpg' }))).toBe('https://images.invalid/example.jpg');
  });
  it('validates upload sizes and formats, and falls back to Arabic text', () => {
    expect(validSiteImageFile(new File(['image'], 'PHOTO.JPEG'))).toBe(true);
    expect(validSiteImageFile(new File([], 'empty.png'))).toBe(false);
    expect(validSiteImageFile(new File(['<svg/>'], 'image.svg'))).toBe(false);
    expect(validSiteImageFile(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.webp'))).toBe(false);
    expect(siteImageText(image(), 'ru')).toEqual({ title: 'مزرعة', description: 'وصف', alt: 'مزرعة' });
  });
});
