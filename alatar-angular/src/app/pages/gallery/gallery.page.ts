import { CommonModule, DOCUMENT } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, computed, signal, HostListener, inject, OnInit, OnDestroy } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';

import { PublicSiteImagesStore } from '../../core/site-images/public-site-images.store';
import { SiteImageStatusComponent } from '../../components/site-image-status/site-image-status.component';

type GalleryCategory = 'all' | 'farms' | 'stations' | 'crops' | 'legacy';

interface FilterOption {
  id: GalleryCategory;
  labelKey: string;
  icon: string;
}


@Component({
  selector: 'app-gallery-page',
  standalone: true,
  imports: [CommonModule, NavbarComponent, TranslocoModule, SiteImageStatusComponent],
  providers: [PublicSiteImagesStore],
  templateUrl: './gallery.page.html',
  styleUrl: './gallery.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryPageComponent implements OnInit, OnDestroy {
  private readonly document = inject(DOCUMENT);
  readonly media = inject(PublicSiteImagesStore);
  readonly items = computed(() => this.media.album('gallery'));
  ngOnInit(): void { this.loadImages(); }
  ngOnDestroy(): void { this.closeImage(); }
  loadImages(): void { this.closeImage(); this.media.load('gallery'); }
  readonly activeFilter = signal<GalleryCategory>('all');
  readonly selectedImageIndex = signal<number | null>(null);

  readonly filterOptions: FilterOption[] = [
    { id: 'all', labelKey: 'all', icon: 'collections' },
    { id: 'farms', labelKey: 'farms', icon: 'landscape' },
    { id: 'stations', labelKey: 'sorting', icon: 'precision_manufacturing' },
    { id: 'crops', labelKey: 'crops', icon: 'agriculture' },
    { id: 'legacy', labelKey: 'legacy', icon: 'workspace_premium' },
  ];


  readonly visibleItems = computed(() => {
    const filter = this.activeFilter();
    return filter === 'all' ? this.items() : this.items().filter((item) => item.category === filter);
  });

  readonly currentSelectedImage = computed(() => {
    const idx = this.selectedImageIndex();
    if (idx === null || !this.visibleItems()[idx]) return null;
    return this.visibleItems()[idx];
  });

  setFilter(filter: GalleryCategory): void {
    this.activeFilter.set(filter);
    this.closeImage();
  }

  openImage(index: number): void {
    this.selectedImageIndex.set(index);
    this.document.body.style.overflow = 'hidden';
  }

  closeImage(): void {
    this.selectedImageIndex.set(null);
    this.document.body.style.overflow = '';
  }

  nextImage(event: Event): void {
    event.stopPropagation();
    const current = this.selectedImageIndex() ?? 0;
    const max = this.visibleItems().length - 1;
    this.selectedImageIndex.set(current < max ? current + 1 : 0);
  }

  prevImage(event: Event): void {
    event.stopPropagation();
    const current = this.selectedImageIndex() ?? 0;
    const max = this.visibleItems().length - 1;
    this.selectedImageIndex.set(current > 0 ? current - 1 : max);
  }

  // Keyboard navigation
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (this.selectedImageIndex() === null) return;

    if (event.key === 'Escape') {
      this.closeImage();
    } else if (event.key === 'ArrowRight') {
      this.nextImage(event);
    } else if (event.key === 'ArrowLeft') {
      this.prevImage(event);
    }
  }
}
