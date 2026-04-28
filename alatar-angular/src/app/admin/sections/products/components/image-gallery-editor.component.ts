import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';

import { ProductImageInfo } from '../../../../core/products/product.service';
import { ImageWithFallbackComponent } from '../../../../shared/ui/image-with-fallback.component';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-image-gallery-editor',
  standalone: true,
  imports: [CommonModule, TranslocoPipe, ImageWithFallbackComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="image-gallery">
      @if (!productId) {
        <div class="image-gallery__notice" role="status">
          <span class="material-symbols-outlined">info</span>
          <span>{{ 'admin.products.form.image_save_first' | transloco }}</span>
        </div>
      } @else {
        <div
          class="image-gallery__dropzone"
          [class.is-dragging]="isDragging()"
          [class.is-disabled]="isUploading"
          (click)="openFileDialog()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
          tabindex="0"
          role="button"
          [attr.aria-label]="('admin.products.form.image_upload' | transloco)"
          (keydown.enter)="openFileDialog()"
          (keydown.space)="openFileDialog(); $event.preventDefault()"
        >
          <input
            #fileInput
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            class="image-gallery__file-input"
            (change)="onFilesPicked($event)"
          />
          <span class="material-symbols-outlined image-gallery__dropzone-icon">cloud_upload</span>
          <strong class="image-gallery__dropzone-title">
            {{ 'admin.products.form.image_upload' | transloco }}
          </strong>
          <span class="image-gallery__dropzone-hint">
            {{ 'admin.products.form.image_upload_hint' | transloco }}
          </span>
          @if (isUploading) {
            <span class="image-gallery__uploading">
              <span class="material-symbols-outlined image-gallery__spin">progress_activity</span>
              {{ 'admin.products.form.image_uploading' | transloco }}
            </span>
          }
        </div>
      }

      @if (errorMessage()) {
        <p class="image-gallery__error" role="alert">{{ errorMessage() }}</p>
      }

      @if (images.length > 0) {
        <ul class="image-gallery__grid" role="list">
          @for (image of images; track image.id; let i = $index) {
            <li class="image-gallery__cell" [class.is-deleting]="deletingId() === image.id">
              @if (i === 0) {
                <span class="image-gallery__primary-badge">
                  {{ 'admin.products.form.image_primary' | transloco }}
                </span>
              }
              <ui-image
                [src]="image.url"
                [alt]="''"
                aspectRatio="1 / 1"
                radius="0.625rem"
              ></ui-image>
              <button
                type="button"
                class="image-gallery__delete"
                [disabled]="deletingId() !== null"
                (click)="onDelete(image.id)"
                [attr.aria-label]="('admin.products.form.image_delete' | transloco)"
              >
                @if (deletingId() === image.id) {
                  <span class="material-symbols-outlined image-gallery__spin">progress_activity</span>
                } @else {
                  <span class="material-symbols-outlined">delete</span>
                }
              </button>
            </li>
          }
        </ul>
      } @else if (productId && !isUploading) {
        <p class="image-gallery__empty">{{ 'admin.products.form.no_images' | transloco }}</p>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .image-gallery {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .image-gallery__notice {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        padding: 0.875rem 1rem;
        background: #fefce8;
        border: 1px solid #fde68a;
        border-radius: 0.625rem;
        color: #854d0e;
        font-size: 0.875rem;
      }

      .image-gallery__dropzone {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        min-height: 160px;
        padding: 1.5rem;
        border: 2px dashed var(--color-border, #cbd5e1);
        border-radius: 1rem;
        background: var(--color-surface-subtle, #f8fafc);
        color: var(--color-text-secondary, #64748b);
        cursor: pointer;
        transition: background 0.15s ease, border-color 0.15s ease;
        text-align: center;
      }
      .image-gallery__dropzone:hover {
        background: #ecfdf5;
        border-color: #0fbd66;
        color: #065f46;
      }
      .image-gallery__dropzone:focus-visible {
        outline: 2px solid #0fbd66;
        outline-offset: 2px;
      }
      .image-gallery__dropzone.is-dragging {
        background: #ecfdf5;
        border-color: #0fbd66;
        color: #065f46;
      }
      .image-gallery__dropzone.is-disabled {
        pointer-events: none;
        opacity: 0.7;
      }
      .image-gallery__dropzone-icon {
        font-size: 2rem;
      }
      .image-gallery__dropzone-title {
        font-size: 0.9375rem;
        font-weight: 700;
        color: var(--color-text-primary, #0f172a);
      }
      .image-gallery__dropzone-hint {
        font-size: 0.8125rem;
      }
      .image-gallery__file-input {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      .image-gallery__uploading {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.8125rem;
        color: var(--color-text-secondary, #64748b);
      }
      .image-gallery__spin {
        animation: image-spin 0.9s linear infinite;
      }
      @keyframes image-spin {
        to {
          transform: rotate(360deg);
        }
      }
      .image-gallery__error {
        margin: 0;
        padding: 0.75rem 1rem;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 0.625rem;
        color: #7f1d1d;
        font-size: 0.875rem;
      }

      .image-gallery__grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 0.75rem;
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .image-gallery__cell {
        position: relative;
        border-radius: 0.625rem;
        overflow: hidden;
        border: 1px solid var(--color-border, #e2e8f0);
        background: #ffffff;
        transition: opacity 0.15s ease;
      }
      .image-gallery__cell.is-deleting {
        opacity: 0.55;
      }
      .image-gallery__primary-badge {
        position: absolute;
        top: 0.375rem;
        inset-inline-start: 0.375rem;
        z-index: 2;
        padding: 0.125rem 0.5rem;
        background: rgba(15, 189, 102, 0.9);
        color: #ffffff;
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-radius: 9999px;
      }
      .image-gallery__delete {
        position: absolute;
        top: 0.375rem;
        inset-inline-end: 0.375rem;
        z-index: 2;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 9999px;
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid var(--color-border, #e2e8f0);
        color: #b3142f;
        cursor: pointer;
      }
      .image-gallery__delete:hover:not(:disabled) {
        background: #fee2e2;
        border-color: #fecaca;
      }
      .image-gallery__delete:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .image-gallery__delete .material-symbols-outlined {
        font-size: 1.125rem;
      }
      .image-gallery__empty {
        margin: 0;
        font-size: 0.875rem;
        color: var(--color-text-secondary, #64748b);
      }
    `,
  ],
})
export class ImageGalleryEditorComponent {
  @ViewChild('fileInput', { static: false }) private fileInput?: ElementRef<HTMLInputElement>;

  @Input() productId: string | null = null;
  @Input() images: ProductImageInfo[] = [];
  @Input() isUploading = false;

  @Output() readonly upload = new EventEmitter<File[]>();
  @Output() readonly delete = new EventEmitter<string>();

  readonly isDragging = signal(false);
  readonly deletingId = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  openFileDialog(): void {
    if (!this.productId || this.isUploading) return;
    this.fileInput?.nativeElement.click();
  }

  onFilesPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const files = Array.from(input.files);
    input.value = '';
    this.tryUpload(files);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.productId || this.isUploading) return;
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    if (!this.productId || this.isUploading) return;
    const files = Array.from(event.dataTransfer?.files ?? []);
    if (files.length === 0) return;
    this.tryUpload(files);
  }

  setDeleting(id: string | null): void {
    this.deletingId.set(id);
  }

  onDelete(imageId: string): void {
    if (this.deletingId() !== null) return;
    this.deletingId.set(imageId);
    this.delete.emit(imageId);
  }

  private tryUpload(files: File[]): void {
    this.errorMessage.set(null);
    const valid: File[] = [];
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        this.errorMessage.set(this.formatBadType(file.name));
        continue;
      }
      if (file.size > MAX_BYTES) {
        this.errorMessage.set(this.formatTooLarge(file.name));
        continue;
      }
      valid.push(file);
    }
    if (valid.length === 0) return;
    this.upload.emit(valid);
  }

  private formatBadType(name: string): string {
    return `${name}: invalid file type (use JPG, PNG, WEBP)`;
  }

  private formatTooLarge(name: string): string {
    return `${name}: exceeds 5 MB limit`;
  }
}
