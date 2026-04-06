import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, computed, signal, HostListener } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';

type GalleryCategory = 'all' | 'farms' | 'stations' | 'crops' | 'legacy';

interface FilterOption {
  id: GalleryCategory;
  labelKey: string;
  icon: string;
}

interface GalleryItem {
  id: number;
  category: GalleryCategory;
  src: string;
  alt: string;
  titleKey: string;
  descKey?: string;
}

@Component({
  selector: 'app-gallery-page',
  standalone: true,
  imports: [CommonModule, NavbarComponent, TranslocoModule],
  templateUrl: './gallery.page.html',
  styleUrl: './gallery.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryPageComponent {
  readonly activeFilter = signal<GalleryCategory>('all');
  readonly selectedImageIndex = signal<number | null>(null);

  readonly filterOptions: FilterOption[] = [
    { id: 'all', labelKey: 'all', icon: 'collections' },
    { id: 'farms', labelKey: 'farms', icon: 'landscape' },
    { id: 'stations', labelKey: 'sorting', icon: 'precision_manufacturing' },
    { id: 'crops', labelKey: 'crops', icon: 'agriculture' },
    { id: 'legacy', labelKey: 'legacy', icon: 'workspace_premium' },
  ];

  readonly items: GalleryItem[] = [
    {
      id: 1,
      category: 'crops',
      src: 'assets/Images/2.jpeg',
      alt: 'Orange',
      titleKey: 'crops_1',
      descKey: 'crops_1',
    },
    {
      id: 2,
      category: 'crops',
      src: 'assets/Images/1.jpeg',
      alt: 'Pepper',
      titleKey: 'crops_2',
      descKey: 'crops_2',
    },
    {
      id: 3,
      category: 'crops',
      src: 'assets/Images/3.jpeg',
      alt: 'Grapes',
      titleKey: 'crops_3',
      descKey: 'crops_3',
    },
    {
      id: 4,
      category: 'crops',
      src: 'assets/Images/4.jpeg',
      alt: 'Mango',
      titleKey: 'crops_4',
      descKey: 'crops_4',
    },
    {
      id: 5,
      category: 'crops',
      src: 'assets/Images/7.jpeg',
      alt: 'Strawberry',
      titleKey: 'crops_5',
      descKey: 'crops_5',
    },
    {
      id: 6,
      category: 'crops',
      src: 'assets/Images/8.jpeg',
      alt: 'Onion',
      titleKey: 'crops_6',
      descKey: 'crops_6',
    },
    {
      id: 7,
      category: 'stations',
      src: 'assets/Images/mhaoutside.jpeg',
      alt: 'MHA station exterior',
      titleKey: 'mha_1',
      descKey: 'mha_1',
    },
    {
      id: 8,
      category: 'stations',
      src: 'assets/Images/outsidemha.jpeg',
      alt: 'MHA station outside view',
      titleKey: 'mha_2',
      descKey: 'mha_2',
    },
    {
      id: 9,
      category: 'stations',
      src: 'assets/Images/mhainside.jpeg',
      alt: 'MHA station inside line',
      titleKey: 'mha_3',
      descKey: 'mha_3',
    },
    {
      id: 10,
      category: 'stations',
      src: 'assets/Images/mhainside2.jpeg',
      alt: 'MHA station sorting line',
      titleKey: 'mha_4',
      descKey: 'mha_4',
    },
    {
      id: 11,
      category: 'stations',
      src: 'assets/Images/mhainside3.jpeg',
      alt: 'MHA station packaging area',
      titleKey: 'mha_5',
      descKey: 'mha_5',
    },
    {
      id: 12,
      category: 'stations',
      src: 'assets/Images/mhainside4.jpeg',
      alt: 'MHA station operations',
      titleKey: 'mha_6',
      descKey: 'mha_6',
    },
    {
      id: 13,
      category: 'stations',
      src: 'assets/Images/alattarstation2.jpeg',
      alt: 'Al Attar station exterior',
      titleKey: 'attar_1',
      descKey: 'attar_1',
    },
    {
      id: 14,
      category: 'stations',
      src: 'assets/Images/alattarstationinside.jpeg',
      alt: 'Al Attar station yard',
      titleKey: 'attar_2',
      descKey: 'attar_2',
    },
    {
      id: 15,
      category: 'stations',
      src: 'assets/Images/alattarstationinside2.jpeg',
      alt: 'Al Attar station processing line',
      titleKey: 'attar_3',
      descKey: 'attar_3',
    },
    {
      id: 16,
      category: 'stations',
      src: 'assets/Images/alattarstationinside3.jpeg',
      alt: 'Al Attar station sorting and handling',
      titleKey: 'attar_4',
      descKey: 'attar_4',
    },
  ];

  readonly visibleItems = computed(() => {
    const filter = this.activeFilter();
    return filter === 'all' ? this.items : this.items.filter((item) => item.category === filter);
  });

  readonly currentSelectedImage = computed(() => {
    const idx = this.selectedImageIndex();
    if (idx === null || !this.visibleItems()[idx]) return null;
    return this.visibleItems()[idx];
  });

  setFilter(filter: GalleryCategory): void {
    this.activeFilter.set(filter);
    this.selectedImageIndex.set(null); // Reset on filter change just in case
  }

  openImage(index: number): void {
    this.selectedImageIndex.set(index);
    document.body.style.overflow = 'hidden';
  }

  closeImage(): void {
    this.selectedImageIndex.set(null);
    document.body.style.overflow = '';
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
