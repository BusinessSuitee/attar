import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { Toast, ToastService } from './toast.service';

@Component({
  selector: 'admin-toast-host',
  standalone: true,
  imports: [NgClass, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="admin-toast-host"
      role="region"
      [attr.aria-label]="'common.aria.notifications' | transloco"
      aria-live="polite"
    >
      @for (toast of toasts(); track toast.id) {
        <div class="admin-toast" [ngClass]="'admin-toast--' + toast.level" role="status">
          <span class="admin-toast__message">{{ toast.message }}</span>
          @if (toast.action) {
            <button
              type="button"
              class="admin-toast__action"
              (click)="invokeAction(toast)"
            >
              {{ toast.action.label }}
            </button>
          }
          <button
            type="button"
            class="admin-toast__close"
            [attr.aria-label]="'common.aria.dismiss' | transloco"
            (click)="dismiss(toast.id)"
          >
            ×
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        position: fixed;
        top: 1rem;
        inset-inline-end: 1rem;
        z-index: 9999;
        pointer-events: none;
      }
      .admin-toast-host {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-width: min(22rem, calc(100vw - 2rem));
      }
      @media (max-width: 359px) {
        .admin-toast {
          flex-wrap: wrap;
        }
        .admin-toast__action {
          width: 100%;
          margin-top: 0.25rem;
        }
      }
      .admin-toast {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-radius: 0.75rem;
        background: var(--color-surface-card, #ffffff);
        border: 1px solid var(--color-border, #e2e8f0);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        font-size: 0.875rem;
        pointer-events: auto;
        animation: admin-toast-in 0.2s ease-out;
      }
      .admin-toast--success {
        border-color: #6b9b7a;
        background: #f0faf4;
        color: #14532d;
      }
      .admin-toast--error {
        border-color: #d4183d;
        background: #fef2f2;
        color: #7f1d1d;
      }
      .admin-toast--info {
        border-color: #3b82f6;
        background: #eff6ff;
        color: #1e3a8a;
      }
      .admin-toast__message {
        flex: 1;
        line-height: 1.4;
      }
      .admin-toast__action {
        background: transparent;
        border: 1px solid currentColor;
        color: inherit;
        padding: 0.25rem 0.625rem;
        border-radius: 0.5rem;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        min-height: 28px;
      }
      .admin-toast__action:hover {
        background: rgba(0, 0, 0, 0.05);
      }
      .admin-toast__close {
        background: transparent;
        border: none;
        color: inherit;
        font-size: 1.25rem;
        line-height: 1;
        cursor: pointer;
        padding: 0 0.25rem;
        opacity: 0.7;
      }
      .admin-toast__close:hover {
        opacity: 1;
      }
      @keyframes admin-toast-in {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .admin-toast {
          animation: none;
        }
      }
    `,
  ],
})
export class AdminToastHostComponent {
  private readonly toastService = inject(ToastService);
  readonly toasts = this.toastService.toasts;

  invokeAction(toast: Toast): void {
    if (!toast.action) return;
    toast.action.run();
    this.toastService.dismiss(toast.id);
  }

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}
