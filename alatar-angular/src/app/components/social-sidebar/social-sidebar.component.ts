import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  SocialLinkDto,
  SocialLinkService,
} from '../../core/social-links/social-link.service';
import { PlatformIconDefinition, getPlatformIcon } from './social-icons';

// Remove this once the API is wired and returning real social links.
const FALLBACK_LINKS: SocialLinkDto[] = [
  {
    id: 'fallback-linkedin',
    platform: 'LinkedIn',
    url: 'https://linkedin.com/company/alatar-sons',
    label: 'LinkedIn',
    iconKey: null,
    customIconUrl: null,
    colorHex: null,
    displayOrder: 1,
    isEnabled: true,
    opensInNewTab: true,
  },
  {
    id: 'fallback-whatsapp',
    platform: 'WhatsApp',
    url: 'https://wa.me/201004623085',
    label: 'WhatsApp',
    iconKey: null,
    customIconUrl: null,
    colorHex: null,
    displayOrder: 2,
    isEnabled: true,
    opensInNewTab: true,
  },
  {
    id: 'fallback-facebook',
    platform: 'Facebook',
    url: 'https://facebook.com/alatar-sons',
    label: 'Facebook',
    iconKey: null,
    customIconUrl: null,
    colorHex: null,
    displayOrder: 3,
    isEnabled: true,
    opensInNewTab: true,
  },
];

interface RenderableLink {
  id: string;
  url: string;
  label: string;
  color: string;
  customIconUrl: string | null;
  iconSvg: SafeHtml | null;
  opensInNewTab: boolean;
}

@Component({
  selector: 'app-social-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './social-sidebar.component.html',
  styleUrl: './social-sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialSidebarComponent implements OnInit {
  private readonly service = inject(SocialLinkService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly links = signal<SocialLinkDto[]>(FALLBACK_LINKS);
  readonly loading = signal(false);

  readonly items = computed<RenderableLink[]>(() =>
    this.links().map((link) => this.toRenderable(link)),
  );

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.loading.set(false);
      return;
    }

    this.service
      .getPublic()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.links.set(data?.length ? data : FALLBACK_LINKS);
          this.loading.set(false);
        },
        error: () => {
          this.links.set(FALLBACK_LINKS);
          this.loading.set(false);
        },
      });
  }

  trackById(_: number, item: RenderableLink): string {
    return item.id;
  }

  private toRenderable(link: SocialLinkDto): RenderableLink {
    const def: PlatformIconDefinition = getPlatformIcon(link.platform);
    const color = link.colorHex?.trim() || def.color;

    let iconSvg: SafeHtml | null = null;
    if (!link.customIconUrl) {
      const svgMarkup = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="${def.viewBox ?? '0 0 24 24'}"
             width="22" height="22" fill="currentColor" aria-hidden="true" focusable="false">
          <path d="${def.svgPath}"/>
        </svg>`;
      iconSvg = this.sanitizer.bypassSecurityTrustHtml(svgMarkup);
    }

    return {
      id: link.id,
      url: link.url,
      label: link.label || def.label,
      color,
      customIconUrl: link.customIconUrl,
      iconSvg,
      opensInNewTab: link.opensInNewTab,
    };
  }
}
