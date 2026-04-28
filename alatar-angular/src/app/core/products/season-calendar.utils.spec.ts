import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CATEGORY_ACCENT,
  SEASON_MONTHS,
  getAvailableMonths,
  getCategoryAccent,
  isInSeasonNow,
} from './season-calendar.utils';

describe('SEASON_MONTHS', () => {
  it('Summer covers April through September inclusive', () => {
    expect(SEASON_MONTHS.Summer).toEqual([4, 5, 6, 7, 8, 9]);
  });

  it('Winter covers October through March (wrapping the year)', () => {
    expect(SEASON_MONTHS.Winter).toEqual([10, 11, 12, 1, 2, 3]);
  });

  it('AllYear covers all twelve months', () => {
    expect(SEASON_MONTHS.AllYear).toHaveLength(12);
    expect(SEASON_MONTHS.AllYear).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
});

describe('getAvailableMonths', () => {
  it('returns the SEASON_MONTHS entry for the given season', () => {
    expect(getAvailableMonths('Summer')).toEqual(SEASON_MONTHS.Summer);
    expect(getAvailableMonths('Winter')).toEqual(SEASON_MONTHS.Winter);
    expect(getAvailableMonths('AllYear')).toEqual(SEASON_MONTHS.AllYear);
  });
});

describe('isInSeasonNow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true for a Summer product in July', () => {
    vi.setSystemTime(new Date(2026, 6, 15));
    expect(isInSeasonNow('Summer')).toBe(true);
  });

  it('returns false for a Winter product in July', () => {
    vi.setSystemTime(new Date(2026, 6, 15));
    expect(isInSeasonNow('Winter')).toBe(false);
  });

  it('returns true for a Winter product in December', () => {
    vi.setSystemTime(new Date(2026, 11, 1));
    expect(isInSeasonNow('Winter')).toBe(true);
  });

  it('returns true for AllYear products in any month', () => {
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      vi.setSystemTime(new Date(2026, monthIndex, 1));
      expect(isInSeasonNow('AllYear')).toBe(true);
    }
  });

  it('handles boundary months — Summer in April and September', () => {
    vi.setSystemTime(new Date(2026, 3, 1));
    expect(isInSeasonNow('Summer')).toBe(true);
    vi.setSystemTime(new Date(2026, 8, 30));
    expect(isInSeasonNow('Summer')).toBe(true);
  });

  it('handles boundary months — Winter in October and March', () => {
    vi.setSystemTime(new Date(2026, 9, 1));
    expect(isInSeasonNow('Winter')).toBe(true);
    vi.setSystemTime(new Date(2026, 2, 31));
    expect(isInSeasonNow('Winter')).toBe(true);
  });
});

describe('getCategoryAccent', () => {
  it('returns the orange tone for Fruit + Fresh', () => {
    expect(getCategoryAccent('Fruit', 'Fresh')).toBe('#f97316');
  });

  it('returns the green tone for Vegetable + Fresh', () => {
    expect(getCategoryAccent('Vegetable', 'Fresh')).toBe('#22c55e');
  });

  it('returns the ice-blue tone for any Frozen product regardless of type', () => {
    expect(getCategoryAccent('Fruit', 'Frozen')).toBe('#0ea5e9');
    expect(getCategoryAccent('Vegetable', 'Frozen')).toBe('#0ea5e9');
  });

  it('uses the constant table verbatim', () => {
    expect(CATEGORY_ACCENT['Fruit-Fresh']).toBe('#f97316');
    expect(CATEGORY_ACCENT['Vegetable-Fresh']).toBe('#22c55e');
    expect(CATEGORY_ACCENT['Frozen']).toBe('#0ea5e9');
  });
});
