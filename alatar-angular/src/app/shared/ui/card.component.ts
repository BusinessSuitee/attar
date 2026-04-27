import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

export type CardPadding = 'default' | 'compact' | 'none';
export type CardElevation = 'flat' | 'raised' | 'elevated';

@Component({
  selector: 'ui-card',
  standalone: true,
  imports: [NgClass],
  template: `
    <div [ngClass]="['rounded-2xl bg-white text-slate-800 transition-shadow', paddingClass(), elevationClass()]">
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-slot': 'card' },
})
export class CardComponent {
  @Input() padding: CardPadding = 'default';
  @Input() elevation: CardElevation = 'raised';

  paddingClass(): string {
    switch (this.padding) {
      case 'none': return '';
      case 'compact': return 'p-4';
      default: return 'p-6';
    }
  }

  elevationClass(): string {
    switch (this.elevation) {
      case 'flat': return '';
      case 'elevated': return 'shadow-[0_4px_12px_rgba(0,0,0,0.08)]';
      default: return 'shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.08)]';
    }
  }
}
