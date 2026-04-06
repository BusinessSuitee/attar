import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { TranslocoModule } from '@jsverse/transloco';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [RouterModule, NavbarComponent, TranslocoModule, ScrollRevealDirective],
  templateUrl: './about.page.html',
  styleUrl: './about.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPageComponent {}
