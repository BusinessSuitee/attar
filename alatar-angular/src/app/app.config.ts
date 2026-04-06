import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  PLATFORM_ID,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  isDevMode,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  PreloadAllModules,
  provideRouter,
  withEnabledBlockingInitialNavigation,
  withInMemoryScrolling,
  withPreloading,
} from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from './transloco-loader';
import { authErrorInterceptor } from './core/auth/auth-error.interceptor';
import { authInterceptor } from './core/auth/auth.interceptor';
import { API_BASE_URL } from './core/config/api-base-url.token';
import { routes } from './app.routes';

function resolveApiBaseUrl(platformId: object): string {
  const productionApiBaseUrl = 'https://attar.runasp.net';

  if (!isPlatformBrowser(platformId)) {
    return productionApiBaseUrl;
  }

  const isLocalHost =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (isLocalHost) {
    if (window.location.protocol === 'https:') {
      return 'https://localhost:7253';
    }

    return 'http://127.0.0.1:5070';
  }

  return productionApiBaseUrl;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withEnabledBlockingInitialNavigation(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
      withPreloading(PreloadAllModules),
    ),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, authErrorInterceptor])),
    provideTransloco({
      config: {
        availableLangs: ['ar', 'en', 'ru'],
        defaultLang: 'ar',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    {
      provide: API_BASE_URL,
      useFactory: resolveApiBaseUrl,
      deps: [PLATFORM_ID],
    },
  ],
};
