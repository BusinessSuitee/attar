import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { TranslocoModule } from '@jsverse/transloco';
import { PublicSiteImagesStore } from '../../core/site-images/public-site-images.store';
import { SiteImageStatusComponent } from '../../components/site-image-status/site-image-status.component';
import { StationImageAlbumComponent } from '../../components/station-image-album/station-image-album.component';

@Component({
  selector: 'app-stations-page',
  standalone: true,
  imports: [NavbarComponent, TranslocoModule, SiteImageStatusComponent, StationImageAlbumComponent],
  providers: [PublicSiteImagesStore],
  templateUrl: './stations.page.html',
  styleUrl: './stations.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StationsPageComponent implements OnInit {
  readonly media = inject(PublicSiteImagesStore);
  constructor() { }

  ngOnInit(): void {
    this.media.load('stations');
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }
}
