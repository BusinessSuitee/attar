import { DestroyRef, Pipe, PipeTransform, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';
import { BilingualPair, pickFromMaybeBilingualString, pickLocalized } from '../../shared/format/localized-name';
import { AppLang, normalizeLang } from './current-lang.signal';

@Pipe({
  name: 'localizedText',
  standalone: true,
  pure: false,
})
export class LocalizedTextPipe implements PipeTransform {
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly lang = signal<AppLang>(normalizeLang(this.transloco.getActiveLang()));

  constructor() {
    this.transloco.langChanges$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((lang) => this.lang.set(normalizeLang(lang)));
  }

  transform(input: BilingualPair | string | null | undefined): string {
    if (input == null) return '';
    const lang = this.lang();
    if (typeof input === 'string') {
      return pickFromMaybeBilingualString(input, lang).value;
    }
    return pickLocalized(input, lang).value;
  }
}
