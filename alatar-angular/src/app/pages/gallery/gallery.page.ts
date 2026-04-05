import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal, HostListener } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';

type GalleryCategory = 'all' | 'farms' | 'stations' | 'crops' | 'legacy';

interface FilterOption {
  id: GalleryCategory;
  label: string;
  icon: string;
}

interface GalleryItem {
  id: number;
  category: GalleryCategory;
  src: string;
  alt: string;
  title: string;
  description?: string;
}

@Component({
  selector: 'app-gallery-page',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './gallery.page.html',
  styleUrl: './gallery.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryPageComponent {
  readonly activeFilter = signal<GalleryCategory>('all');
  readonly selectedImageIndex = signal<number | null>(null);

  readonly filterOptions: FilterOption[] = [
    { id: 'all', label: 'الكل', icon: 'collections' },
    { id: 'farms', label: 'المزارع والأراضي', icon: 'landscape' },
    { id: 'stations', label: 'المحطات والإنتاج', icon: 'precision_manufacturing' },
    { id: 'crops', label: 'المحاصيل', icon: 'agriculture' },
    { id: 'legacy', label: 'إرث المؤسس', icon: 'workspace_premium' },
  ];

  readonly items: GalleryItem[] = [
    // --- Crops (Real assets) ---
    {
      id: 1,
      category: 'crops',
      src: 'assets/Images/2.jpeg',
      alt: 'البرتقال المصري',
      title: 'البرتقال المصري للاستهلاك الطازج',
      description: 'محصول شتوي متميز للتصدير.',
    },
    {
      id: 2,
      category: 'crops',
      src: 'assets/Images/1.jpeg',
      alt: 'عنب أبيض',
      title: 'عنب أبيض بدون بذور',
      description: 'محصول صيفي طازج.',
    },
    {
      id: 3,
      category: 'crops',
      src: 'assets/Images/3.jpeg',
      alt: 'عنب أسود',
      title: 'عنب أسود فاخر',
      description: 'محصول صيفي للتصدير المبكر.',
    },
    {
      id: 4,
      category: 'crops',
      src: 'assets/Images/4.jpeg',
      alt: 'المانجو',
      title: 'مانجو مصرية',
      description: 'ثمرات منتقاة وعالية المذاق.',
    },
    {
      id: 5,
      category: 'crops',
      src: 'assets/Images/7.jpeg',
      alt: 'الفراولة',
      title: 'فراولة طازجة',
      description: 'محصول التصدير الأول شتوياً.',
    },
    {
      id: 6,
      category: 'crops',
      src: 'assets/Images/8.jpeg',
      alt: 'بصل مصري',
      title: 'بصل أحمر',
      description: 'صلابة وقدرة تخزينية ممتازة.',
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
