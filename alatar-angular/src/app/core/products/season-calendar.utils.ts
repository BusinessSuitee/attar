import { ProductSeason, ProductState, ProductType } from './product.service';

export const SEASON_MONTHS: Record<ProductSeason, number[]> = {
  Summer: [4, 5, 6, 7, 8, 9],
  Winter: [10, 11, 12, 1, 2, 3],
  AllYear: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
};

export const CATEGORY_ACCENT: Record<string, string> = {
  'Fruit-Fresh': '#f97316',
  'Vegetable-Fresh': '#22c55e',
  Frozen: '#0ea5e9',
};

const CATEGORY_ACCENT_FALLBACK = '#94a3b8';

export function isInSeasonNow(season: ProductSeason): boolean {
  const month = new Date().getMonth() + 1;
  return SEASON_MONTHS[season].includes(month);
}

export function getAvailableMonths(season: ProductSeason): number[] {
  return SEASON_MONTHS[season];
}

export function getCategoryAccent(type: ProductType, state: ProductState): string {
  const key = state === 'Frozen' ? 'Frozen' : `${type}-${state}`;
  return CATEGORY_ACCENT[key] ?? CATEGORY_ACCENT_FALLBACK;
}
