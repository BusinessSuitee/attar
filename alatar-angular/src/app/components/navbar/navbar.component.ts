import { CommonModule, DOCUMENT } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';

import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';

type LanguageCode = 'ar' | 'en' | 'ru';

interface NavItem {
  id: string;
  label: string; // fallback if transloco isn't used or used dynamically
  translocoKey: string;
  route: string;
  fragment?: string;
}

interface DockItem {
  id: string;
  label: string;
  icon: string;
  kind: 'navigate' | 'menu';
  target?: string;
  route?: string;
  fragment?: string;
}

interface LanguageOption {
  code: LanguageCode;
  flagSrc: string;
  name: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslocoPipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent implements OnInit, OnDestroy {
  private readonly doc = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly mobileBreakpoint = 767;
  private readonly hideOffset = 72;
  private lastScrollY = 0;
  private routeEventsSub?: Subscription;

  @Input() showSidebarToggle = false;
  @Output() sidebarToggle = new EventEmitter<void>();

  readonly menuOpen = signal(false);
  readonly activeItem = signal('home');
  readonly isScrolled = signal(false);
  readonly topNavVisible = signal(true);
  readonly activeLanguage = signal<LanguageCode>('ar');

  private translocoService = inject(TranslocoService);

  readonly navItems: NavItem[] = [
    { id: 'home', translocoKey: 'nav.home', label: 'الرئيسية', route: '/', fragment: 'home' },
    {
      id: 'about',
      translocoKey: 'nav.about',
      label: 'من نحن',
      route: '/about',
      fragment: undefined,
    },
    {
      id: 'partners',
      translocoKey: 'nav.partners',
      label: 'شركاؤنا',
      route: '/partners',
      fragment: undefined,
    },
    {
      id: 'products',
      translocoKey: 'nav.products',
      label: 'المحاصيل',
      route: '/products',
      fragment: undefined,
    },
    {
      id: 'stations',
      translocoKey: 'nav.stations',
      label: 'المحطات والأراضي',
      route: '/stations',
      fragment: undefined,
    },
    {
      id: 'gallery',
      translocoKey: 'nav.gallery',
      label: 'المعرض',
      route: '/gallery',
      fragment: undefined,
    },
    {
      id: 'contact',
      translocoKey: 'nav.contact',
      label: 'اتصل بنا',
      route: '/contact',
      fragment: undefined,
    },
  ];

  readonly dockItems: DockItem[] = [
    {
      id: 'home',
      label: 'الرئيسية',
      icon: 'home',
      kind: 'navigate',
      target: 'home',
      route: '/',
      fragment: 'home',
    },
    {
      id: 'products',
      label: 'المحاصيل',
      icon: 'agriculture',
      kind: 'navigate',
      target: 'products',
      route: '/products',
      fragment: undefined,
    },
    {
      id: 'gallery',
      label: 'المعرض',
      icon: 'photo_library',
      kind: 'navigate',
      target: 'gallery',
      route: '/gallery',
      fragment: undefined,
    },
    {
      id: 'contact',
      label: 'تواصل',
      icon: 'call',
      kind: 'navigate',
      target: 'contact',
      route: '/contact',
      fragment: undefined,
    },
    { id: 'more', label: 'المزيد', icon: 'widgets', kind: 'menu' },
  ];

  readonly languages: LanguageOption[] = [
    { code: 'ar', flagSrc: 'assets/flags/eg.svg', name: 'العربية' },
    { code: 'en', flagSrc: 'assets/flags/gb.svg', name: 'English' },
    { code: 'ru', flagSrc: 'assets/flags/ru.svg', name: 'Русский' },
  ];

  private readonly dockNavigationIds = new Set(
    this.dockItems
      .filter(
        (item): item is DockItem & { target: string } =>
          item.kind === 'navigate' && Boolean(item.target),
      )
      .map((item) => item.target),
  );

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const currentY = Math.max(window.scrollY, 0);
    this.isScrolled.set(currentY > 14);

    if (window.innerWidth > this.mobileBreakpoint) {
      this.topNavVisible.set(true);
      this.lastScrollY = currentY;
      return;
    }

    if (currentY <= 8) {
      this.topNavVisible.set(true);
      this.lastScrollY = currentY;
      return;
    }

    const delta = currentY - this.lastScrollY;

    if (delta > 8 && currentY > this.hideOffset && !this.menuOpen()) {
      this.topNavVisible.set(false);
    } else if (delta < -6) {
      this.topNavVisible.set(true);
    }

    this.lastScrollY = currentY;
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (window.innerWidth > this.mobileBreakpoint) {
      this.topNavVisible.set(true);
    }
  }

  onNavSelect(itemId: string): void {
    this.activeItem.set(itemId);
    this.menuOpen.set(false);
  }

  onDockSelect(item: DockItem): void {
    if (item.kind === 'menu') {
      this.openMenu();
      return;
    }

    if (item.target) {
      this.onNavSelect(item.target);
    }
  }

  toggleMenu(): void {
    const next = !this.menuOpen();
    this.menuOpen.set(next);

    if (next) {
      this.topNavVisible.set(true);
    }
  }

  openMenu(): void {
    this.menuOpen.set(true);
    this.topNavVisible.set(true);
  }

  onSidebarToggle(): void {
    this.sidebarToggle.emit();
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  iconForItem(itemId: string): string {
    const iconMap: Record<string, string> = {
      home: 'home',
      about: 'history_edu',
      partners: 'handshake',
      products: 'agriculture',
      stations: 'factory',
      gallery: 'photo_library',
      contact: 'call',
    };

    return iconMap[itemId] ?? 'chevron_left';
  }

  isDockNavigation(itemId: string): boolean {
    return this.dockNavigationIds.has(itemId);
  }

  trackById(_: number, item: NavItem | DockItem): string {
    return item.id;
  }

  setLanguage(code: LanguageCode): void {
    if (this.activeLanguage() === code) return;
    this.activeLanguage.set(code);
    this.translocoService.setActiveLang(code);
    const dir = code === 'ar' ? 'rtl' : 'ltr';
    this.doc.documentElement.lang = code;
    this.doc.documentElement.dir = dir;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('alatarLanguage', code);
    }
  }

  ngOnInit(): void {
    let langToSet: LanguageCode = 'ar';
    if (typeof localStorage !== 'undefined') {
      const savedLang = localStorage.getItem('alatarLanguage') as LanguageCode | null;
      if (savedLang && ['ar', 'en', 'ru'].includes(savedLang)) {
        langToSet = savedLang;
      }
    }

    // Always call setLanguage on init to apply lang/dir to document synchronously
    this.activeLanguage.set(langToSet);
    this.translocoService.setActiveLang(langToSet);
    const dir = langToSet === 'ar' ? 'rtl' : 'ltr';
    this.doc.documentElement.lang = langToSet;
    this.doc.documentElement.dir = dir;

    this.syncActiveItemFromUrl();

    this.routeEventsSub = this.router.events.subscribe((event) => {
      if (!(event instanceof NavigationEnd)) {
        return;
      }

      this.syncActiveItemFromUrl();
      this.topNavVisible.set(true);

      if (typeof window !== 'undefined') {
        this.lastScrollY = Math.max(window.scrollY, 0);
      }
    });
  }

  ngOnDestroy(): void {
    this.routeEventsSub?.unsubscribe();
  }

  private syncActiveItemFromUrl(): void {
    const tree = this.router.parseUrl(this.router.url);
    const primary = tree.root.children['primary'];
    const routePath = primary ? `/${primary.segments.map((s) => s.path).join('/')}` : '/';
    const path = routePath === '//' ? '/' : routePath;
    const fragment = tree.fragment ?? undefined;

    let matchedItem: NavItem | undefined;

    if (path === '/' && fragment) {
      matchedItem = this.navItems.find((item) => item.route === '/' && item.fragment === fragment);
    }

    if (!matchedItem) {
      matchedItem = this.navItems.find((item) => item.route === path && !item.fragment);
    }

    if (!matchedItem && path === '/') {
      matchedItem = this.navItems.find((item) => item.id === 'home');
    }

    this.activeItem.set(matchedItem?.id ?? 'home');
  }
}
