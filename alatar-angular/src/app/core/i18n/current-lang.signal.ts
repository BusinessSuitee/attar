import { DestroyRef, Signal, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';

export type AppLang = 'ar' | 'en' | 'ru';

const SUPPORTED: readonly AppLang[] = ['ar', 'en', 'ru'] as const;

export function normalizeLang(value: string | null | undefined): AppLang {
  const v = (value ?? 'en').toLowerCase();
  if (v.startsWith('ar')) return 'ar';
  if (v.startsWith('ru')) return 'ru';
  return 'en';
}

export function provideCurrentLangSignal(): Signal<AppLang> {
  const transloco = inject(TranslocoService);
  const destroyRef = inject(DestroyRef);
  const value = signal<AppLang>(normalizeLang(transloco.getActiveLang()));

  transloco.langChanges$
    .pipe(takeUntilDestroyed(destroyRef))
    .subscribe((lang) => value.set(normalizeLang(lang)));

  return value.asReadonly();
}

export function isRtl(lang: AppLang): boolean {
  return lang === 'ar';
}

export const SUPPORTED_LANGS = SUPPORTED;
