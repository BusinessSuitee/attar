import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

export type BadgeTone = 'neutral' | 'brand' | 'season' | 'warning' | 'success' | 'info';

@Component({
  selector: 'ui-badge',
  standalone: true,
  imports: [NgClass],
  template: `
    <span
      [ngClass]="[
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold uppercase tracking-[0.05em]',
        toneClass()
      ]"
    >
      <ng-content />
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-slot': 'badge' },
})
export class BadgeComponent {
  @Input() tone: BadgeTone = 'neutral';

  toneClass(): string {
    switch (this.tone) {
      case 'brand': return 'bg-primary/10 text-primary-dark';
      case 'season': return 'bg-amber-50 text-amber-700';
      case 'warning': return 'bg-orange-50 text-orange-700';
      case 'success': return 'bg-emerald-50 text-emerald-700';
      case 'info': return 'bg-sky-50 text-sky-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  }
}
