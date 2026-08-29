import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { TranslocoModule } from '@jsverse/transloco';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-stations-page',
  standalone: true,
  imports: [NavbarComponent, TranslocoModule, ScrollRevealDirective],
  templateUrl: './stations.page.html',
  styleUrl: './stations.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StationsPageComponent implements OnInit {
  constructor() { }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }
}
