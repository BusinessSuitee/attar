import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { NgClass } from '@angular/common';

export type ConfirmDialogTone = 'neutral' | 'danger';

@Component({
  selector: 'admin-confirm-dialog',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      #dialogRef
      class="admin-confirm-dialog"
      (close)="onDialogClose()"
      (cancel)="onDialogCancel($event)"
    >
      <form method="dialog" class="admin-confirm-dialog__form">
        @if (title) {
          <h2 class="admin-confirm-dialog__title">{{ title }}</h2>
        }
        @if (description) {
          <p class="admin-confirm-dialog__description">{{ description }}</p>
        }

        <div class="admin-confirm-dialog__body">
          <ng-content></ng-content>
        </div>

        @if (showFooter) {
          <div class="admin-confirm-dialog__footer">
            <button
              type="button"
              class="admin-confirm-dialog__btn admin-confirm-dialog__btn--ghost"
              (click)="cancelClicked()"
            >
              {{ cancelLabel }}
            </button>
            <button
              type="button"
              [ngClass]="[
                'admin-confirm-dialog__btn',
                tone === 'danger' ? 'admin-confirm-dialog__btn--danger' : 'admin-confirm-dialog__btn--primary'
              ]"
              [disabled]="confirmDisabled"
              (click)="confirmClicked()"
            >
              {{ confirmLabel }}
            </button>
          </div>
        }
      </form>
    </dialog>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .admin-confirm-dialog {
        border: none;
        padding: 0;
        border-radius: 1rem;
        max-width: 32rem;
        width: 90vw;
        max-height: 90vh;
        background: var(--color-surface-card, #ffffff);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        color: var(--color-text-primary, #0f172a);
      }
      .admin-confirm-dialog::backdrop {
        background: rgba(15, 23, 42, 0.5);
      }
      .admin-confirm-dialog__form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1.5rem;
        margin: 0;
        overflow-y: auto;
        max-height: inherit;
      }
      .admin-confirm-dialog__title {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 700;
      }
      .admin-confirm-dialog__description {
        margin: 0;
        color: var(--color-text-secondary, #64748b);
        font-size: 0.875rem;
        line-height: 1.5;
      }
      .admin-confirm-dialog__body:empty {
        display: none;
      }
      .admin-confirm-dialog__footer {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
        margin-top: 0.5rem;
      }
      .admin-confirm-dialog__btn {
        min-height: 44px;
        min-width: 88px;
        padding: 0 1rem;
        border-radius: 0.625rem;
        font-weight: 600;
        font-size: 0.875rem;
        cursor: pointer;
        border: 1px solid transparent;
        transition: background 0.15s ease;
      }
      .admin-confirm-dialog__btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .admin-confirm-dialog__btn--ghost {
        background: transparent;
        border-color: var(--color-border, #e2e8f0);
        color: var(--color-text-primary, #0f172a);
      }
      .admin-confirm-dialog__btn--ghost:hover:not(:disabled) {
        background: var(--color-surface-subtle, #f1f5f9);
      }
      .admin-confirm-dialog__btn--primary {
        background: #0fbd66;
        color: #ffffff;
      }
      .admin-confirm-dialog__btn--primary:hover:not(:disabled) {
        background: #0a8a4a;
      }
      .admin-confirm-dialog__btn--danger {
        background: #d4183d;
        color: #ffffff;
      }
      .admin-confirm-dialog__btn--danger:hover:not(:disabled) {
        background: #b3142f;
      }
    `,
  ],
})
export class AdminConfirmDialogComponent implements OnChanges {
  @ViewChild('dialogRef', { static: true }) private dialogRef!: ElementRef<HTMLDialogElement>;

  @Input() open = false;
  @Input() title = '';
  @Input() description = '';
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel = 'Cancel';
  @Input() tone: ConfirmDialogTone = 'neutral';
  @Input() confirmDisabled = false;
  @Input() showFooter = true;

  @Output() readonly confirm = new EventEmitter<void>();
  @Output() readonly cancel = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['open']) return;
    const dialog = this.dialogRef?.nativeElement;
    if (!dialog) return;
    if (this.open && !dialog.open) {
      dialog.showModal();
    } else if (!this.open && dialog.open) {
      dialog.close();
    }
  }

  confirmClicked(): void {
    this.confirm.emit();
  }

  cancelClicked(): void {
    this.cancel.emit();
  }

  onDialogClose(): void {
    if (this.open) {
      this.cancel.emit();
    }
  }

  onDialogCancel(event: Event): void {
    event.preventDefault();
    this.cancel.emit();
  }
}
