import { Injectable, signal } from '@angular/core';

export type ToastLevel = 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  run: () => void;
}

export interface Toast {
  id: string;
  level: ToastLevel;
  message: string;
  action?: ToastAction;
  durationMs: number;
}

const DEFAULT_DURATIONS: Record<ToastLevel, number> = {
  success: 4000,
  error: 8000,
  info: 6000,
};

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly state = signal<Toast[]>([]);
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  readonly toasts = this.state.asReadonly();

  success(message: string, action?: ToastAction): string {
    return this.push('success', message, action);
  }

  error(message: string, action?: ToastAction): string {
    return this.push('error', message, action);
  }

  info(message: string, action?: ToastAction): string {
    return this.push('info', message, action);
  }

  dismiss(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.state.update((current) => current.filter((toast) => toast.id !== id));
  }

  private push(level: ToastLevel, message: string, action?: ToastAction): string {
    const id = this.generateId();
    const durationMs = DEFAULT_DURATIONS[level];
    const toast: Toast = { id, level, message, action, durationMs };

    this.state.update((current) => [...current, toast]);

    const timer = setTimeout(() => this.dismiss(id), durationMs);
    this.timers.set(id, timer);

    return id;
  }

  private generateId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
