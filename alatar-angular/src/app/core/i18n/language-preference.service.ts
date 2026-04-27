import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslocoService } from '@jsverse/transloco';
import { AppLang, SUPPORTED_LANGS, normalizeLang } from './current-lang.signal';

const STORAGE_KEY = 'attar.lang';

@Injectable({ providedIn: 'root' })
export class LanguagePreferenceService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly transloco = inject(TranslocoService);

  applyStoredOrInferred(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const stored = this.readStored();
    if (stored) {
      this.transloco.setActiveLang(stored);
      return;
    }

    const inferred = this.inferFromBrowser();
    if (inferred && inferred !== this.transloco.getActiveLang()) {
      this.transloco.setActiveLang(inferred);
    }
  }

  setLanguage(lang: AppLang): void {
    this.transloco.setActiveLang(lang);
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // localStorage may be unavailable (private mode, quota); silent fallback.
    }
  }

  current(): AppLang {
    return normalizeLang(this.transloco.getActiveLang());
  }

  private readStored(): AppLang | null {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return SUPPORTED_LANGS.includes(raw as AppLang) ? (raw as AppLang) : null;
    } catch {
      return null;
    }
  }

  private inferFromBrowser(): AppLang | null {
    try {
      const navLang = window.navigator?.language ?? '';
      const norm = normalizeLang(navLang);
      return navLang ? norm : null;
    } catch {
      return null;
    }
  }
}
