import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { AdminSidebarComponent } from './admin-sidebar/admin-sidebar.component';
import { AdminTopbarComponent } from './admin-topbar/admin-topbar.component';
import { AdminToastHostComponent } from '../shared/toasts/toast-host.component';

export type AdminBreakpoint = 'mobile' | 'tablet' | 'desktop';
export type AdminSidebarState = 'expanded' | 'collapsed' | 'drawer-open' | 'hidden';

const SIDEBAR_PREF_KEY = 'alatar.admin.sidebar.collapsed';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    TranslocoPipe,
    AdminSidebarComponent,
    AdminTopbarComponent,
    AdminToastHostComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.css',
})
export class AdminShellComponent implements OnInit, OnDestroy {
  private readonly doc = inject(DOCUMENT);
  private readonly isBrowser = typeof window !== 'undefined';

  readonly breakpoint = signal<AdminBreakpoint>('desktop');
  readonly desktopCollapsedPref = signal<boolean>(false);
  readonly drawerOpen = signal<boolean>(false);

  readonly sidebarState = computed<AdminSidebarState>(() => {
    const bp = this.breakpoint();
    if (bp === 'mobile') {
      return this.drawerOpen() ? 'drawer-open' : 'hidden';
    }
    if (bp === 'tablet') {
      return 'collapsed';
    }
    return this.desktopCollapsedPref() ? 'collapsed' : 'expanded';
  });

  readonly showsBackdrop = computed(() => this.sidebarState() === 'drawer-open');

  constructor() {
    effect(() => {
      const state = this.sidebarState();
      if (typeof document === 'undefined') {
        return;
      }
      this.doc.body.classList.toggle('admin-shell--drawer-open', state === 'drawer-open');
    });
  }

  ngOnInit(): void {
    if (!this.isBrowser) {
      return;
    }
    this.recalcBreakpoint();
    const saved = localStorage.getItem(SIDEBAR_PREF_KEY);
    if (saved === '1') {
      this.desktopCollapsedPref.set(true);
    }
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      this.doc.body.classList.remove('admin-shell--drawer-open');
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.recalcBreakpoint();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.drawerOpen()) {
      this.drawerOpen.set(false);
    }
  }

  toggleSidebar(): void {
    const bp = this.breakpoint();
    if (bp === 'mobile') {
      this.drawerOpen.update((open) => !open);
      return;
    }
    if (bp === 'desktop') {
      const next = !this.desktopCollapsedPref();
      this.desktopCollapsedPref.set(next);
      if (this.isBrowser) {
        localStorage.setItem(SIDEBAR_PREF_KEY, next ? '1' : '0');
      }
    }
  }

  closeDrawer(): void {
    if (this.drawerOpen()) {
      this.drawerOpen.set(false);
    }
  }

  private recalcBreakpoint(): void {
    if (!this.isBrowser) {
      return;
    }
    const w = window.innerWidth;
    if (w < 768) {
      this.breakpoint.set('mobile');
    } else if (w < 1024) {
      this.breakpoint.set('tablet');
      if (this.drawerOpen()) {
        this.drawerOpen.set(false);
      }
    } else {
      this.breakpoint.set('desktop');
      if (this.drawerOpen()) {
        this.drawerOpen.set(false);
      }
    }
  }
}
