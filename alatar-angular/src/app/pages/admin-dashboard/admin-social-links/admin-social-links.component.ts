import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Observable, finalize } from 'rxjs';
import {
  PLATFORM_LIST,
  PlatformIconDefinition,
  getPlatformIcon,
} from '../../../components/social-sidebar/social-icons';
import {
  CreateSocialLinkPayload,
  SocialLinkDto,
  SocialLinkService,
  SocialPlatform,
  UpdateSocialLinkPayload,
} from '../../../core/social-links/social-link.service';

interface SocialLinkRow {
  dto: SocialLinkDto;
  iconSvg: SafeHtml | null;
  color: string;
  platformLabel: string;
}

interface FormState {
  id: string | null;
  platform: SocialPlatform;
  url: string;
  label: string;
  colorHex: string;
  useDefaultColor: boolean;
  opensInNewTab: boolean;
}

const EMPTY_FORM: FormState = {
  id: null,
  platform: 'WhatsApp',
  url: '',
  label: '',
  colorHex: '',
  useDefaultColor: true,
  opensInNewTab: true,
};

@Component({
  selector: 'app-admin-social-links',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-social-links.component.html',
  styleUrl: './admin-social-links.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSocialLinksComponent implements OnInit {
  @ViewChild('iconFileInput') private iconFileInput?: ElementRef<HTMLInputElement>;

  private readonly service = inject(SocialLinkService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);

  readonly platforms: PlatformIconDefinition[] = PLATFORM_LIST;

  private readonly linksSignal = signal<SocialLinkDto[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly submitting = signal(false);
  readonly submitError = signal('');
  readonly submitSuccess = signal('');
  readonly uploadingIconForId = signal<string | null>(null);
  readonly busyIds = signal<ReadonlySet<string>>(new Set());

  readonly form = signal<FormState>({ ...EMPTY_FORM });
  readonly isFormOpen = signal(false);
  readonly isEditing = computed(() => this.form().id !== null);

  readonly rows = computed<SocialLinkRow[]>(() =>
    this.linksSignal().map((dto) => this.toRow(dto)),
  );

  readonly selectedPlatformDefinition = computed<PlatformIconDefinition>(() =>
    getPlatformIcon(this.form().platform),
  );

  readonly previewColor = computed(() => {
    const state = this.form();
    if (!state.useDefaultColor && state.colorHex.trim().length > 0) {
      return state.colorHex.trim();
    }
    return this.selectedPlatformDefinition().color;
  });

  readonly previewIcon = computed<SafeHtml>(() => {
    const def = this.selectedPlatformDefinition();
    return this.buildSvg(def);
  });

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.service
      .getAll()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (items) => this.linksSignal.set(items ?? []),
        error: () => this.loadError.set('تعذّر تحميل الروابط. حاول مرة أخرى.'),
      });
  }

  openCreate(): void {
    this.form.set({ ...EMPTY_FORM });
    this.submitError.set('');
    this.submitSuccess.set('');
    this.isFormOpen.set(true);
  }

  openEdit(dto: SocialLinkDto): void {
    this.form.set({
      id: dto.id,
      platform: dto.platform,
      url: dto.url,
      label: dto.label,
      colorHex: dto.colorHex ?? '',
      useDefaultColor: !dto.colorHex,
      opensInNewTab: dto.opensInNewTab,
    });
    this.submitError.set('');
    this.submitSuccess.set('');
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.form.set({ ...EMPTY_FORM });
  }

  updateField<K extends keyof FormState>(key: K, value: FormState[K]): void {
    const next = { ...this.form(), [key]: value };
    this.form.set(next);
  }

  onPlatformChange(platform: SocialPlatform): void {
    const current = this.form();
    const def = getPlatformIcon(platform);
    const suggestedLabel = current.label.trim().length > 0 ? current.label : def.label;
    this.form.set({
      ...current,
      platform,
      label: suggestedLabel,
    });
  }

  submitForm(): void {
    const state = this.form();
    const trimmedUrl = state.url.trim();
    const trimmedLabel = state.label.trim();

    if (!trimmedUrl) {
      this.submitError.set('الـ URL مطلوب.');
      return;
    }
    if (!trimmedLabel) {
      this.submitError.set('الـ Label مطلوب.');
      return;
    }

    const payload: CreateSocialLinkPayload = {
      platform: state.platform,
      url: trimmedUrl,
      label: trimmedLabel,
      iconKey: null,
      colorHex: state.useDefaultColor ? null : state.colorHex.trim() || null,
      opensInNewTab: state.opensInNewTab,
    };

    this.submitting.set(true);
    this.submitError.set('');
    this.submitSuccess.set('');

    const request$: Observable<unknown> = state.id
      ? this.service.update(state.id, payload as UpdateSocialLinkPayload)
      : this.service.create(payload);

    request$
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.submitSuccess.set(state.id ? 'تم التحديث بنجاح.' : 'تم إضافة الرابط بنجاح.');
          this.isFormOpen.set(false);
          this.form.set({ ...EMPTY_FORM });
          this.reload();
        },
        error: (err: { error?: { detail?: string; message?: string } }) => {
          this.submitError.set(err?.error?.detail || err?.error?.message || 'تعذّر الحفظ.');
        },
      });
  }

  toggle(row: SocialLinkRow): void {
    const id = row.dto.id;
    this.markBusy(id, true);
    this.service
      .toggle(id, !row.dto.isEnabled)
      .pipe(
        finalize(() => this.markBusy(id, false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.linksSignal.update((items) =>
            items.map((item) =>
              item.id === id ? { ...item, isEnabled: !item.isEnabled } : item,
            ),
          );
        },
        error: () => {
          this.loadError.set('تعذّر تحديث الحالة.');
        },
      });
  }

  moveUp(index: number): void {
    if (index <= 0) {
      return;
    }
    this.reorderLocal(index, index - 1);
  }

  moveDown(index: number): void {
    const items = this.linksSignal();
    if (index >= items.length - 1) {
      return;
    }
    this.reorderLocal(index, index + 1);
  }

  delete(row: SocialLinkRow): void {
    if (typeof window !== 'undefined' && !window.confirm(`حذف "${row.dto.label}"؟`)) {
      return;
    }
    const id = row.dto.id;
    this.markBusy(id, true);
    this.service
      .delete(id)
      .pipe(
        finalize(() => this.markBusy(id, false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.linksSignal.update((items) => items.filter((item) => item.id !== id));
        },
        error: () => this.loadError.set('تعذّر الحذف.'),
      });
  }

  triggerIconUpload(id: string): void {
    this.uploadingIconForId.set(id);
    setTimeout(() => this.iconFileInput?.nativeElement.click(), 0);
  }

  onIconFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const id = this.uploadingIconForId();
    input.value = '';
    if (!file || !id) {
      this.uploadingIconForId.set(null);
      return;
    }
    this.markBusy(id, true);
    this.service
      .uploadIcon(id, file)
      .pipe(
        finalize(() => {
          this.markBusy(id, false);
          this.uploadingIconForId.set(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.linksSignal.update((items) =>
            items.map((item) =>
              item.id === id ? { ...item, customIconUrl: response.url } : item,
            ),
          );
        },
        error: (err) => {
          this.loadError.set(err?.error?.message || 'تعذّر رفع الأيقونة.');
        },
      });
  }

  removeCustomIcon(row: SocialLinkRow): void {
    if (!row.dto.customIconUrl) {
      return;
    }
    const id = row.dto.id;
    this.markBusy(id, true);
    this.service
      .deleteIcon(id)
      .pipe(
        finalize(() => this.markBusy(id, false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.linksSignal.update((items) =>
            items.map((item) =>
              item.id === id ? { ...item, customIconUrl: null } : item,
            ),
          );
        },
        error: () => this.loadError.set('تعذّر إزالة الأيقونة.'),
      });
  }

  isBusy(id: string): boolean {
    return this.busyIds().has(id);
  }

  trackByRow(_: number, row: SocialLinkRow): string {
    return row.dto.id;
  }

  trackByPlatform(_: number, def: PlatformIconDefinition): string {
    return def.key;
  }

  private reorderLocal(fromIndex: number, toIndex: number): void {
    const items = [...this.linksSignal()];
    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);
    this.linksSignal.set(items);

    const orderedIds = items.map((item) => item.id);
    this.service
      .reorder(orderedIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => {
          this.loadError.set('تعذّر حفظ الترتيب الجديد.');
          this.reload();
        },
      });
  }

  private markBusy(id: string, busy: boolean): void {
    const next = new Set(this.busyIds());
    if (busy) {
      next.add(id);
    } else {
      next.delete(id);
    }
    this.busyIds.set(next);
  }

  private toRow(dto: SocialLinkDto): SocialLinkRow {
    const def = getPlatformIcon(dto.platform);
    const color = dto.colorHex?.trim() || def.color;
    const iconSvg = dto.customIconUrl ? null : this.buildSvg(def);
    return {
      dto,
      iconSvg,
      color,
      platformLabel: def.label,
    };
  }

  private buildSvg(def: PlatformIconDefinition): SafeHtml {
    const markup = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="${def.viewBox ?? '0 0 24 24'}"
           width="20" height="20" fill="currentColor" aria-hidden="true" focusable="false">
        <path d="${def.svgPath}"/>
      </svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(markup);
  }
}
