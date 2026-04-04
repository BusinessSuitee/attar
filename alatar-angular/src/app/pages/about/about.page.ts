import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [RouterModule, NavbarComponent, TranslocoModule],
  templateUrl: './about.page.html',
  styleUrl: './about.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutPageComponent {}
