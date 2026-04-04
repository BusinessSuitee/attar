import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';

interface HeroStripItem {
  icon: string;
  labelKey: string;
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink, TranslocoModule, CommonModule],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeroComponent {
  readonly stripItems: HeroStripItem[] = [
    { icon: 'public', labelKey: '0' },
    { icon: 'local_shipping', labelKey: '1' },
    { icon: 'history', labelKey: '2' },
    { icon: 'verified', labelKey: '3' }
  ];

  trackByLabelKey(_: number, item: HeroStripItem): string {
    return item.labelKey;
  }
}