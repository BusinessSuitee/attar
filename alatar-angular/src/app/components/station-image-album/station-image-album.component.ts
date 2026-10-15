import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { SiteImageView } from '../../core/site-images/site-image.service';

@Component({
  selector: 'app-station-image-album', standalone: true, imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (images.length) {
      <div class="album" [class.album--compact]="compact" [class.album--mha]="captionFirst">
        @for (image of images; track image.id; let i = $index) {
          <div class="album__image group" [class.album__image--first]="!compact && i === 0">
            <img [src]="image.src" [alt]="image.alt" loading="lazy" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            @if (captionFirst && i === 0) {
              <div class="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-4">
                <p class="font-bold text-white">{{ image.title }}</p>
              </div>
            }
          </div>
        }
      </div>
    } @else {
      @if (!compact) {
        <div class="album__empty bg-slate-100 dark:bg-neutral-dark">
          @if (!pending) { <p>{{ 'site_images.empty' | transloco }}</p> }
        </div>
      }
    }
  `,
  styles: [`
    :host { display: block; }
    .album { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .album__image { height: 150px; position: relative; overflow: hidden; border-radius: 1rem; background: #e2e8f0; box-shadow: 0 4px 10px #0f172a15; }
    .album--mha .album__image { height: 170px; }
    .album .album__image--first { height: 240px; grid-column: 1 / -1; }
    .album--compact { grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr)); margin-top: 2rem; }
    .album--compact .album__image { height: 240px; }
    .album__empty { min-height: 400px; display: grid; place-items: center; border-radius: 1rem; color: #64748b; }
  `],
})
export class StationImageAlbumComponent {
  @Input() images: SiteImageView[] = [];
  @Input() captionFirst = false;
  @Input() compact = false;
  @Input() pending = false;
}
