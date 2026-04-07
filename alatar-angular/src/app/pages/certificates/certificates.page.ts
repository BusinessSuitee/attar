import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { TranslocoModule } from '@jsverse/transloco';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';

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
    const cert = this.certificates[index];
    if (cert.type === 'pdf') {
      window.open(cert.src, '_blank');
      return;
    }
    this.selectedCertIndex.set(index);
    document.body.style.overflow = 'hidden';
  }

  closeCert(): void {
    this.selectedCertIndex.set(null);
    document.body.style.overflow = '';
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (this.selectedCertIndex() === null) return;
    if (event.key === 'Escape') {
      this.closeCert();
    }
  }
}
