import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { AdminPageComponent } from '../../layout/admin-page/admin-page.component';
import { AdminPageHeaderComponent } from '../../layout/admin-page-header/admin-page-header.component';
import { AdminSectionCardComponent } from '../../layout/admin-section-card/admin-section-card.component';
import { AdminConfirmDialogComponent } from '../../shared/ui/confirm-dialog.component';
import { ToastService } from '../../shared/toasts/toast.service';
import { BackendErrorTranslator } from '../../../core/api/backend-error-translator.service';
import { LanguagePreferenceService } from '../../../core/i18n/language-preference.service';
import { SITE_IMAGE_PLACEMENTS, SITE_IMAGE_SLOTS, SiteImageDto, SiteImageLanguage, SiteImageMetadata, SiteImagePlacement, SiteImageService, siteImageText, validSiteImageFile } from '../../../core/site-images/site-image.service';

const emptyText = () => ({ title: '', description: '', alt: '' });
const emptyForm = (): SiteImageMetadata => ({ placement: 'gallery', category: 'farms', isEnabled: true, ar: emptyText(), en: emptyText(), ru: emptyText() });

@Component({
  selector: 'app-admin-site-images', standalone: true,
  imports: [FormsModule, TranslocoPipe, AdminPageComponent, AdminPageHeaderComponent, AdminSectionCardComponent, AdminConfirmDialogComponent],
  templateUrl: './site-images.page.html', styleUrl: './site-images.page.css',
  host: { '[attr.dir]': "language() === 'ar' ? 'rtl' : 'ltr'" },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSiteImagesPageComponent implements OnInit, OnDestroy {
  readonly service = inject(SiteImageService);
  readonly languagePreference = inject(LanguagePreferenceService);
  private readonly toast = inject(ToastService);
  private readonly errors = inject(BackendErrorTranslator);
  private readonly transloco = inject(TranslocoService);
  readonly language = toSignal(this.transloco.langChanges$, { initialValue: this.transloco.getActiveLang() });
  readonly placements = SITE_IMAGE_PLACEMENTS;
  readonly categories = ['farms', 'stations', 'crops', 'legacy'] as const;
  readonly languages: SiteImageLanguage[] = ['ar', 'en', 'ru'];
  readonly items = signal<SiteImageDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly busy = signal(false);
  readonly pageFilter = signal('all');
  readonly placementFilter = signal('all');
  readonly categoryFilter = signal('all');
  readonly statusFilter = signal('all');
  readonly editorOpen = signal(false);
  readonly deleting = signal<SiteImageDto | null>(null);
  readonly preview = signal('');
  readonly formError = signal('');
  readonly filteredPlacements = computed(() => this.placements.filter(p => this.pageFilter() === 'all' || this.pageOf(p) === this.pageFilter()));
  readonly filtered = computed(() => this.items().filter(x =>
    (this.pageFilter() === 'all' || x.page === this.pageFilter()) &&
    (this.placementFilter() === 'all' || x.placement === this.placementFilter()) &&
    (this.categoryFilter() === 'all' || x.category === this.categoryFilter()) &&
    (this.statusFilter() === 'all' || x.isEnabled === (this.statusFilter() === 'visible')),
  ).sort((a, b) => a.placement.localeCompare(b.placement) || a.displayOrder - b.displayOrder));
  form = emptyForm();
  mode: 'create' | 'edit' | 'replace' = 'create';
  editing: SiteImageDto | null = null;
  file: File | null = null;
  private objectUrl: string | null = null;

  ngOnInit(): void { void this.reload(); }
  ngOnDestroy(): void { this.releasePreview(); }
  pageOf(p: string): string { return p === 'gallery' || p === 'gallery-hero' ? 'gallery' : 'stations'; }
  title(image: SiteImageDto): string { return siteImageText(image, this.language()).title; }
  isSlot(p: SiteImagePlacement): boolean { return (SITE_IMAGE_SLOTS as readonly string[]).includes(p); }
  isOccupied(p: SiteImagePlacement): boolean { return this.isSlot(p) && this.items().some(x => x.placement === p && x.id !== this.editing?.id); }
  setPage(value: string): void { this.pageFilter.set(value); this.placementFilter.set('all'); }

  async reload(): Promise<void> {
    this.loading.set(true); this.error.set(false);
    try { this.items.set(await firstValueFrom(this.service.getAll())); }
    catch { this.error.set(true); }
    finally { this.loading.set(false); }
  }

  open(mode: 'create' | 'edit' | 'replace', image?: SiteImageDto): void {
    this.releasePreview();
    this.mode = mode; this.editing = image ?? null; this.file = null; this.formError.set('');
    this.form = image ? { placement: image.placement, category: image.category, isEnabled: image.isEnabled, ar: { ...image.ar }, en: { ...image.en }, ru: { ...image.ru } } : emptyForm();
    if (!image && this.placementFilter() !== 'all') {
      this.form.placement = this.placementFilter() as SiteImagePlacement;
      this.form.category = this.form.placement === 'gallery' ? 'farms' : null;
    } else if (!image && this.pageFilter() === 'stations') {
      this.form.placement = 'station-qtc'; this.form.category = null;
    }
    this.preview.set(image ? this.service.url(image) : ''); this.editorOpen.set(true);
  }

  changePlacement(value: SiteImagePlacement): void {
    this.form.placement = value;
    this.form.category = value === 'gallery' ? this.form.category ?? 'farms' : null;
  }

  chooseFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!validSiteImageFile(file)) { this.formError.set(this.transloco.translate('admin.site_images.invalid_file')); return; }
    this.releasePreview(); this.file = file; this.formError.set('');
    this.objectUrl = URL.createObjectURL(file); this.preview.set(this.objectUrl);
  }

  closeEditor(): void {
    if (this.busy()) return;
    this.editorOpen.set(false); this.releasePreview(); this.file = null;
  }
  private releasePreview(): void { if (this.objectUrl) URL.revokeObjectURL(this.objectUrl); this.objectUrl = null; }

  async save(): Promise<void> {
    if (this.busy()) return;
    if ((this.mode !== 'edit' && !this.file) || (this.mode !== 'replace' && !this.form.ar.title.trim())) {
      this.formError.set(this.transloco.translate('admin.site_images.required')); return;
    }
    let work: Observable<unknown>;
    if (this.mode === 'create') work = this.service.create(this.form, this.file!);
    else if (this.mode === 'replace') work = this.service.replace(this.editing!.id, this.file!);
    else work = this.service.update(this.editing!.id, this.form);
    if (await this.mutate(work)) this.closeEditor();
  }

  async toggle(image: SiteImageDto): Promise<void> {
    await this.mutate(this.service.update(image.id, { ...image, isEnabled: !image.isEnabled }));
  }
  canMove(image: SiteImageDto, direction: number): boolean {
    const group = this.group(image.placement);
    const target = group.findIndex(x => x.id === image.id) + direction;
    return !this.isSlot(image.placement) && target >= 0 && target < group.length;
  }
  private group(p: SiteImagePlacement): SiteImageDto[] { return this.items().filter(x => x.placement === p).sort((a, b) => a.displayOrder - b.displayOrder); }
  async move(image: SiteImageDto, direction: number): Promise<void> {
    if (!this.canMove(image, direction)) return;
    const group = this.group(image.placement).map(x => x.id); const i = group.indexOf(image.id);
    [group[i], group[i + direction]] = [group[i + direction], group[i]];
    await this.mutate(this.service.reorder(image.placement, group));
  }
  async remove(): Promise<void> {
    const image = this.deleting(); if (!image) return;
    if (await this.mutate(this.service.delete(image.id))) this.deleting.set(null);
  }
  deleteDescription(): string {
    const image = this.deleting();
    return image ? this.transloco.translate('admin.site_images.delete_description', {
      title: this.title(image), placement: this.transloco.translate('admin.site_images.placements.' + image.placement),
    }) : '';
  }
  private async mutate(work: Observable<unknown>): Promise<boolean> {
    if (this.busy()) return false;
    this.busy.set(true);
    try {
      await firstValueFrom(work);
      this.toast.success(this.transloco.translate('admin.site_images.saved'));
      await this.reload(); return true;
    } catch (error) {
      const message = error instanceof HttpErrorResponse && error.status === 409 ? this.transloco.translate('admin.site_images.occupied')
        : this.errors.translate(error) || this.transloco.translate('admin.site_images.save_error');
      this.formError.set(message); this.toast.error(message); return false;
    } finally { this.busy.set(false); }
  }
}
