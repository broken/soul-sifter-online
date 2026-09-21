import { describe, it, expect, vi } from 'vitest';
import { resolveDateValue, applyCustomQueryPredicate } from './CustomQueryUtil';

describe('CustomQueryUtil', () => {
  const fixedDate = new Date(2026, 8, 21); // Sept 21, 2026 (month is 0-indexed, so 8 = September)

  describe('resolveDateValue', () => {
    it('resolves month(now()) correctly', () => {
      expect(resolveDateValue('month(now())', fixedDate)).toBe('9');
      expect(resolveDateValue('MONTH(NOW())', fixedDate)).toBe('9');
    });

    it('resolves month(now()) with offset', () => {
      expect(resolveDateValue('month(now())+1', fixedDate)).toBe('10');
      expect(resolveDateValue('month(now())-2', fixedDate)).toBe('7');
    });

    it('resolves day(now()) correctly', () => {
      expect(resolveDateValue('day(now())', fixedDate)).toBe('21');
      expect(resolveDateValue('DAY(NOW())', fixedDate)).toBe('21');
    });

    it('resolves day(now()) with offset', () => {
      expect(resolveDateValue('day(now())-3', fixedDate)).toBe('18');
      expect(resolveDateValue('day(now())+7', fixedDate)).toBe('28');
    });

    it('resolves year(now()) correctly', () => {
      expect(resolveDateValue('year(now())', fixedDate)).toBe('2026');
      expect(resolveDateValue('year(now())-1', fixedDate)).toBe('2025');
    });

    it('preserves static numeric strings', () => {
      expect(resolveDateValue('9', fixedDate)).toBe('9');
      expect(resolveDateValue('2024', fixedDate)).toBe('2024');
      expect(resolveDateValue('15', fixedDate)).toBe('15');
    });
  });

  describe('applyCustomQueryPredicate', () => {
    it('translates 10-year anniversary query into in() filter', () => {
      const mockBuilder: any = {
        in: vi.fn().mockReturnThis(),
      };

      applyCustomQueryPredicate(
        mockBuilder,
        '(year(now())-a.releaseDateYear) % 10 = 0',
        false,
        fixedDate
      );

      expect(mockBuilder.in).toHaveBeenCalledWith('albums.releasedateyear', [
        2026, 2016, 2006, 1996, 1986, 1976, 1966, 1956, 1946, 1936, 1926, 1916, 1906,
      ]);
    });

    it('translates 5-year anniversary query into in() filter', () => {
      const mockBuilder: any = {
        in: vi.fn().mockReturnThis(),
      };

      applyCustomQueryPredicate(
        mockBuilder,
        '(year(now()) - releaseDateYear) % 5 = 0',
        false,
        fixedDate
      );

      expect(mockBuilder.in).toHaveBeenCalledWith(
        'albums.releasedateyear',
        expect.arrayContaining([2026, 2021, 2016, 2011, 2006, 2001, 1996])
      );
    });

    it('warns for unrecognized custom queries', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const mockBuilder: any = {
        in: vi.fn().mockReturnThis(),
      };

      applyCustomQueryPredicate(mockBuilder, 'some_unsupported_mysql_func()', false, fixedDate);

      expect(warnSpy).toHaveBeenCalledWith('Custom query "some_unsupported_mysql_func()" is unsupported.');
      expect(mockBuilder.in).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });
});
