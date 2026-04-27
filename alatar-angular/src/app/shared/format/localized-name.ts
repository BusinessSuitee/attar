import type { AppLang } from '../../core/i18n/current-lang.signal';

export interface LocalizedPick {
  value: string;
  fellBack: boolean;
}

export interface BilingualPair {
  en?: string | null;
  ar?: string | null;
  ru?: string | null;
}

export function pickLocalized(pair: BilingualPair, lang: AppLang): LocalizedPick {
  const preferred = readLang(pair, lang);
  if (preferred) {
    return { value: preferred, fellBack: false };
  }

  const fallbackOrder: AppLang[] = lang === 'ar' ? ['en', 'ru'] : ['ar', 'en', 'ru'];
  for (const candidate of fallbackOrder) {
    if (candidate === lang) continue;
    const text = readLang(pair, candidate);
    if (text) {
      return { value: text, fellBack: true };
    }
  }

  return { value: '', fellBack: false };
}

function readLang(pair: BilingualPair, lang: AppLang): string {
  const raw = lang === 'ar' ? pair.ar : lang === 'ru' ? pair.ru : pair.en;
  return (raw ?? '').trim();
}

const BILINGUAL_DELIMITER = '|';

export function pickFromMaybeBilingualString(raw: string, lang: AppLang): LocalizedPick {
  const normalized = (raw ?? '').trim();
  if (!normalized) return { value: '', fellBack: false };

  if (!normalized.includes(BILINGUAL_DELIMITER)) {
    return { value: normalized, fellBack: false };
  }

  const parts = normalized.split(BILINGUAL_DELIMITER).map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return { value: normalized, fellBack: false };
  if (parts.length === 1) return { value: parts[0], fellBack: false };

  const [first, second] = parts;
  const firstIsArabic = containsArabic(first);
  const secondIsArabic = containsArabic(second);

  let arabic = '';
  let latin = '';

  if (firstIsArabic && !secondIsArabic) {
    arabic = first;
    latin = second;
  } else if (!firstIsArabic && secondIsArabic) {
    latin = first;
    arabic = second;
  } else {
    latin = first;
    arabic = second;
  }

  if (lang === 'ar') {
    return arabic ? { value: arabic, fellBack: false } : { value: latin, fellBack: true };
  }
  return latin ? { value: latin, fellBack: false } : { value: arabic, fellBack: true };
}

function containsArabic(value: string): boolean {
  return /[؀-ۿ]/.test(value);
}
