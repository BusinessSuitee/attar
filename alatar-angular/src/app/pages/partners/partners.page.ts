import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-partners-page',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, TranslocoModule],
  templateUrl: './partners.page.html',
  styleUrl: './partners.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PartnersPageComponent {
}
