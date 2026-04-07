import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  Inject,
  OnInit,
  PLATFORM_ID,
  computed,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { TranslocoModule } from '@jsverse/transloco';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';

type PdfJsModule = typeof import('pdfjs-dist');

interface CertificateItem {
  id: number;
  nameKey: string;
  issuerKey: string;
  scopeKey: string;
  dateKey: string;
  type: 'image' | 'pdf';
  src: string;
  icon: string;
}

@Component({
  selector: 'app-certificates-page',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, TranslocoModule, ScrollRevealDirective],
  templateUrl: './certificates.page.html',
  styleUrl: './certificates.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificatesPageComponent {
  readonly selectedCertIndex = signal<number | null>(null);
  readonly pdfPreviewBySrc = signal<Record<string, string | null>>({});
  readonly selectedCertificate = computed(() => {
    const index = this.selectedCertIndex();
    return index === null ? null : (this.certificates[index] ?? null);
  });
  readonly selectedPdfPreview = computed<string | null>(() => {
    const cert = this.selectedCertificate();
    if (!cert || cert.type !== 'pdf') return null;

    return this.pdfPreviewBySrc()[cert.src] ?? null;
  });

  private readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;
    void this.generatePdfPreviews();
  }

  readonly certificates: CertificateItem[] = [
    {
      id: 1,
      nameKey: 'cert_1.name',
      issuerKey: 'cert_1.issuer',
      scopeKey: 'cert_1.scope',
      dateKey: 'cert_1.date',
      type: 'image',
      src: 'assets/Images/iso9001.png',
      icon: 'verified',
    },
    {
      id: 2,
      nameKey: 'cert_2.name',
      issuerKey: 'cert_2.issuer',
      scopeKey: 'cert_2.scope',
      dateKey: 'cert_2.date',
      type: 'image',
      src: 'assets/Images/HOR091520241210.png',
      icon: 'verified',
    },
    {
      id: 3,
      nameKey: 'cert_3.name',
      issuerKey: 'cert_3.issuer',
      scopeKey: 'cert_3.scope',
      dateKey: 'cert_3.date',
      type: 'pdf',
      src: 'assets/Images/59325-M.H.A For Agricultural Development - GG.pdf',
      icon: 'eco',
    },
    {
      id: 4,
      nameKey: 'cert_4.name',
      issuerKey: 'cert_4.issuer',
      scopeKey: 'cert_4.scope',
      dateKey: 'cert_4.date',
      type: 'pdf',
      src: 'assets/Images/Conformance letter_template_for GRASPv2 LS 1EG6541 16_02_2025.pdf',
      icon: 'group',
    },
    {
      id: 5,
      nameKey: 'cert_5.name',
      issuerKey: 'cert_5.issuer',
      scopeKey: 'cert_5.scope',
      dateKey: 'cert_5.date',
      type: 'pdf',
      src: 'assets/Images/globalgap.org.pdf',
      icon: 'public',
    },
  ];

  openCert(index: number): void {
    this.selectedCertIndex.set(index);
    document.body.style.overflow = 'hidden';
  }

  closeCert(): void {
    this.selectedCertIndex.set(null);
    document.body.style.overflow = '';
  }

  pdfPreviewFor(src: string): string | null {
    return this.pdfPreviewBySrc()[src] ?? null;
  }

  pdfAssetUrl(src: string): string {
    return encodeURI(src);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (this.selectedCertIndex() === null) return;
    if (event.key === 'Escape') {
      this.closeCert();
    }
  }

  private async generatePdfPreviews(): Promise<void> {
    const pdfCertificates = this.certificates.filter((cert) => cert.type === 'pdf');
    if (!pdfCertificates.length) return;

    let pdfjs: PdfJsModule;
    try {
      pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        document.baseURI,
      ).toString();
    } catch (error) {
      console.error('Failed to initialize PDF preview library.', error);
      return;
    }

    for (const cert of pdfCertificates) {
      const preview = await this.renderFirstPdfPage(cert.src, pdfjs);
      this.pdfPreviewBySrc.update((map) => ({ ...map, [cert.src]: preview }));
    }
  }

  private async renderFirstPdfPage(src: string, pdfjs: PdfJsModule): Promise<string | null> {
    try {
      const loadingTask = pdfjs.getDocument({ url: encodeURI(src) });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.25 });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        await pdf.destroy();
        return null;
      }

      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);

      await page.render({ canvas, canvasContext: context, viewport }).promise;

      const previewDataUrl = canvas.toDataURL('image/jpeg', 0.88);
      page.cleanup();
      await pdf.destroy();
      return previewDataUrl;
    } catch (error) {
      console.error(`Failed to render PDF preview for "${src}".`, error);
      return null;
    }
  }
}
