import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-site-image-status', standalone: true, imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading) { <p role="status" class="p-6 text-center text-slate-500">{{ 'site_images.loading' | transloco }}</p> }
    @if (error) {
      <div role="alert" class="m-6 rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-800">
        <p>{{ 'site_images.load_error' | transloco }}</p>
        <button type="button" class="mt-3 rounded-lg bg-primary px-5 py-2 font-bold text-white" (click)="retry.emit()">{{ 'site_images.retry' | transloco }}</button>
      </div>
    }
  `,
})
export class SiteImageStatusComponent {
  @Input() loading = false;
  @Input() error = false;
  @Output() readonly retry = new EventEmitter<void>();
}
