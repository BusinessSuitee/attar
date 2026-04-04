import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-stations-page',
  standalone: true,
  imports: [NavbarComponent, RouterLink, TranslocoModule],
  templateUrl: './stations.page.html',
  styleUrls: ['./stations.page.css']
})
export class StationsPageComponent implements OnInit {
  constructor() { }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }
}
