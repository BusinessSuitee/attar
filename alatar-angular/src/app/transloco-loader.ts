import { inject, Injectable } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { HttpClient } from '@angular/common/http';
import { defer, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private http = inject(HttpClient);

  getTranslation(lang: string) {
    if (typeof window === 'undefined') {
      // In SSR, load directly via dynamic import
      switch (lang) {
        case 'ar': return defer(() => import('../../public/assets/i18n/ar.json').then(m => m.default));
        case 'en': return defer(() => import('../../public/assets/i18n/en.json').then(m => m.default));
        case 'ru': return defer(() => import('../../public/assets/i18n/ru.json').then(m => m.default));
        default: return defer(() => import('../../public/assets/i18n/ar.json').then(m => m.default));
      }
    }
    return this.http.get<Translation>(`/assets/i18n/${lang}.json`);
  }
}


