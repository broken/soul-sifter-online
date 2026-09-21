import { PostgrestFilterBuilder } from '@supabase/postgrest-js';

/**
 * Resolves dynamic date expressions like `now()`, `month(now())`, `day(now())-3`,
 * `day(now())+7`, `year(now())-1` into concrete numeric string values.
 * If the input is already a static number or unrecognized, returns it as-is.
 */
export function resolveDateValue(value: string, baseDate: Date = new Date()): string {
  if (!value) return value;
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();

  // Match month(now()) with optional +/- offset
  const monthMatch = lower.match(/^month\s*\(\s*now\s*\(\s*\)\s*\)(?:\s*([+-])\s*(\d+))?$/i);
  if (monthMatch) {
    let month = baseDate.getMonth() + 1; // 1-12
    if (monthMatch[1] && monthMatch[2]) {
      const offset = parseInt(monthMatch[2], 10);
      month = monthMatch[1] === '+' ? month + offset : month - offset;
    }
    return month.toString();
  }

  // Match day(now()) with optional +/- offset
  const dayMatch = lower.match(/^day\s*\(\s*now\s*\(\s*\)\s*\)(?:\s*([+-])\s*(\d+))?$/i);
  if (dayMatch) {
    let day = baseDate.getDate();
    if (dayMatch[1] && dayMatch[2]) {
      const offset = parseInt(dayMatch[2], 10);
      day = dayMatch[1] === '+' ? day + offset : day - offset;
    }
    return day.toString();
  }

  // Match year(now()) with optional +/- offset
  const yearMatch = lower.match(/^year\s*\(\s*now\s*\(\s*\)\s*\)(?:\s*([+-])\s*(\d+))?$/i);
  if (yearMatch) {
    let year = baseDate.getFullYear();
    if (yearMatch[1] && yearMatch[2]) {
      const offset = parseInt(yearMatch[2], 10);
      year = yearMatch[1] === '+' ? year + offset : year - offset;
    }
    return year.toString();
  }

  return trimmed;
}

/**
 * Parses and applies custom query predicates (e.g. legacy MySQL expressions)
 * to a PostgREST filter builder.
 *
 * Currently handles:
 * - Milestone/anniversary queries: `(year(now()) - a.releaseDateYear) % 10 = 0`
 */
export function applyCustomQueryPredicate(
  builder: PostgrestFilterBuilder<any, any, any[], any, any>,
  customQuery: string,
  isPlaylistQuery: boolean = false,
  baseDate: Date = new Date()
): PostgrestFilterBuilder<any, any, any[], any, any> {
  if (!customQuery) return builder;

  const trimmed = customQuery.trim();

  // Match anniversary modulo expressions like:
  // (year(now()) - a.releaseDateYear) % 10 = 0
  // (year(now())-releasedateyear)%10=0
  const anniversaryRegex = /^\(?\s*year\s*\(\s*now\s*\(\s*\)\s*\)\s*-\s*(?:(?:a|albums)\.)?releaseDateYear\s*\)?\s*%\s*(\d+)\s*=\s*0$/i;
  const match = trimmed.match(anniversaryRegex);

  if (match) {
    const step = parseInt(match[1], 10);
    if (step > 0) {
      const currentYear = baseDate.getFullYear();
      const milestoneYears: number[] = [];
      for (let y = currentYear; y >= 1900; y -= step) {
        milestoneYears.push(y);
      }
      return builder.in('albums.releasedateyear', milestoneYears);
    }
  }

  console.warn(`Custom query "${customQuery}" is unsupported.`);
  return builder;
}
