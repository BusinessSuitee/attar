import { DestroyRef, Signal, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';

export type AppLang = 'ar' | 'en' | 'ru';

const SUPPORTED: readonly AppLang[] = ['ar', 'en', 'ru'] as const;

export function normalizeLang(value: string | null | undefined): AppLang {
  const v = (value ?? 'ar').toLowerCase();
  if (v.startsWith('en')) return 'en';
  if (v.startsWith('ru')) return 'ru';
  return 'ar';
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
