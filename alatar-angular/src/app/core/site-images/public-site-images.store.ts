import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';
import { SiteImageDto, SiteImagePlacement, SiteImageService, SiteImageView, siteImageText } from './site-image.service';

@Injectable()
export class PublicSiteImagesStore {
  private readonly service = inject(SiteImageService);
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly language = toSignal(this.transloco.langChanges$, { initialValue: this.transloco.getActiveLang() });
  private readonly data = signal<SiteImageDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly images = computed<SiteImageView[]>(() => this.data().map(image => ({
    ...image, src: this.service.url(image), ...siteImageText(image, this.language()),
  })));

  load(page: 'gallery' | 'stations'): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(false);
    this.service.getPublic(page).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: images => { this.data.set(images); this.loading.set(false); },
      error: () => { this.data.set([]); this.error.set(true); this.loading.set(false); },
    });
  }
  album(placement: SiteImagePlacement): SiteImageView[] {
    return this.images().filter(image => image.placement === placement).sort((a, b) => a.displayOrder - b.displayOrder);
  }
  background(placement: SiteImagePlacement): string | null {
    const image = this.album(placement)[0];
    return image ? `url("${image.src.replace(/"/g, '%22')}")` : null;
  }
}
