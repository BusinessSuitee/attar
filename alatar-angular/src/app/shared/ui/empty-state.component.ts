import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'ui-empty-state',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div class="text-[18px] font-bold text-slate-800">{{ title }}</div>
      @if (description) {
        <p class="text-[14px] leading-normal text-slate-500 max-w-md">{{ description }}</p>
      }
      <div class="mt-2">
        <ng-content />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-slot': 'empty-state' },
})
export class EmptyStateComponent {
  @Input({ required: true }) title!: string;
  @Input() description = '';
}
