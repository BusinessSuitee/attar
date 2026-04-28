import { Observable } from 'rxjs';
import { ToastService } from '../toasts/toast.service';

export interface OptimisticOptions<R> {
  applyLocally: () => void;
  callServer: () => Observable<R>;
  rollback: () => void;
  toastService?: ToastService;
  successMessage?: string;
  failureMessage?: string;
  retryLabel?: string;
  onSuccess?: (result: R) => void;
  onFailure?: (error: unknown) => void;
}

export function optimistic<R>(opts: OptimisticOptions<R>): void {
  opts.applyLocally();

  opts.callServer().subscribe({
    next: (result) => {
      if (opts.successMessage && opts.toastService) {
        opts.toastService.success(opts.successMessage);
      }
      opts.onSuccess?.(result);
    },
    error: (error) => {
      opts.rollback();
      if (opts.failureMessage && opts.toastService) {
        opts.toastService.error(opts.failureMessage, {
          label: opts.retryLabel ?? 'Retry',
          run: () => optimistic(opts),
        });
      }
      opts.onFailure?.(error);
    },
  });
}
