import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeroComponent } from '../../components/hero/hero.component';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { TranslocoModule } from '@jsverse/transloco';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [NavbarComponent, HeroComponent, TranslocoModule, RouterLink, ScrollRevealDirective],
  templateUrl: './home.page.html',
  styleUrls: [
    './home.page.css',
    './home.founder.css',
    './home.partners.css',
  ],
})
export class HomePageComponent {}
