import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonComponent } from './button.component';

@Component({
  selector: 'ui-error-state',
  standalone: true,
  imports: [ButtonComponent],
  template: `
    <div
      class="flex flex-col items-start gap-3 rounded-2xl border border-red-100 bg-red-50/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
      role="alert"
    >
      <div class="text-[14px] text-red-800">
        <strong class="me-1 font-semibold">{{ title }}</strong>
        <span class="text-red-700/80">{{ description }}</span>
      </div>
      @if (showRetry) {
        <ui-button variant="secondary" (clicked)="retry.emit()">{{ retryLabel }}</ui-button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-slot': 'error-state' },
})
export class ErrorStateComponent {
  @Input({ required: true }) title!: string;
  @Input() description = '';
  @Input() retryLabel = 'Retry';
  @Input() showRetry = true;
  @Output() readonly retry = new EventEmitter<void>();
}
