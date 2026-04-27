import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { AuthenticatedAdmin, AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-admin-user-menu',
  standalone: true,
  imports: [CommonModule, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="admin-user-menu">
      <button
        type="button"
        class="admin-user-menu__trigger"
        [attr.aria-expanded]="open()"
        aria-haspopup="menu"
        (click)="toggle()"
      >
        <span class="admin-user-menu__avatar material-symbols-outlined">account_circle</span>
        <span class="admin-user-menu__label">
          @if (admin(); as a) {
            {{ a.email }}
          } @else {
            {{ 'admin.shell.user_menu.label' | transloco }}
          }
        </span>
        <span class="material-symbols-outlined admin-user-menu__chev">expand_more</span>
      </button>

      @if (open()) {
        <div class="admin-user-menu__panel" role="menu">
          @if (admin(); as a) {
            <div class="admin-user-menu__profile">
              <p class="admin-user-menu__email">{{ a.email }}</p>
              <p class="admin-user-menu__role">{{ a.role }}</p>
            </div>
          }
          <button type="button" class="admin-user-menu__action" (click)="onLogout()" role="menuitem">
            <span class="material-symbols-outlined">logout</span>
            <span>{{ 'admin.shell.user_menu.logout' | transloco }}</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        position: relative;
      }
      .admin-user-menu__trigger {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.375rem 0.75rem 0.375rem 0.5rem;
        height: 2.5rem;
        border-radius: 0.5rem;
        border: 1px solid #e2e8f0;
        background: #ffffff;
        color: #0f172a;
        cursor: pointer;
        font-size: 0.8125rem;
        font-weight: 600;
        transition: background-color 120ms ease;
      }
      .admin-user-menu__trigger:hover {
        background: #f8fafc;
      }
      .admin-user-menu__trigger:focus-visible {
        outline: 2px solid var(--color-brand, #16a34a);
        outline-offset: 2px;
      }
      .admin-user-menu__avatar {
        font-size: 1.5rem;
        color: #64748b;
      }
      .admin-user-menu__label {
        max-width: 12rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .admin-user-menu__chev {
        font-size: 1.125rem;
        color: #94a3b8;
      }
      .admin-user-menu__panel {
        position: absolute;
        top: calc(100% + 0.5rem);
        inset-inline-end: 0;
        min-width: 14rem;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 0.75rem;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        padding: 0.5rem;
        z-index: 50;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .admin-user-menu__profile {
        padding: 0.625rem 0.75rem;
        border-bottom: 1px solid #f1f5f9;
        margin-bottom: 0.25rem;
      }
      .admin-user-menu__email {
        margin: 0;
        font-size: 0.8125rem;
        font-weight: 700;
        color: #0f172a;
        word-break: break-all;
      }
      .admin-user-menu__role {
        margin: 0.125rem 0 0;
        font-size: 0.6875rem;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-weight: 600;
      }
      .admin-user-menu__action {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        padding: 0.5rem 0.75rem;
        border: 0;
        background: transparent;
        border-radius: 0.5rem;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 600;
        color: #0f172a;
        text-align: start;
      }
      .admin-user-menu__action:hover {
        background: #f1f5f9;
      }
      @media (max-width: 767px) {
        .admin-user-menu__label {
          display: none;
        }
        .admin-user-menu__chev {
          display: none;
        }
      }
    `,
  ],
})
export class AdminUserMenuComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  readonly open = signal(false);
  readonly admin = signal<AuthenticatedAdmin | null>(null);

  constructor() {
    this.authService
      .getCurrentAdmin()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (admin) => this.admin.set(admin),
        error: () => this.admin.set(null),
      });
  }

  toggle(): void {
    this.open.update((v) => !v);
  }

  @HostListener('document:click', ['$event'])
  onOutsideClick(event: MouseEvent): void {
    if (!this.open()) {
      return;
    }
    const target = event.target as Node | null;
    if (target && !this.host.nativeElement.contains(target)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) {
      this.open.set(false);
    }
  }

  onLogout(): void {
    this.authService.logout();
    this.open.set(false);
    this.router.navigate(['/admin/login']);
  }
}
