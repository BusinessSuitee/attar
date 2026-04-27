import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'ui-skeleton',
  standalone: true,
  template: `
    <span
      class="block bg-slate-100 motion-safe:animate-pulse"
      [style.width]="width"
      [style.height]="height"
      [style.borderRadius]="radius"
      role="presentation"
      aria-hidden="true"
    ></span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-slot': 'skeleton' },
})
export class SkeletonComponent {
  @Input() width = '100%';
  @Input() height = '1rem';
  @Input() radius = '0.5rem';
}
