import { Component, createSignal, createMemo, createRenderEffect, For, Show } from 'solid-js';
import Backdrop from './Backdrop';

export interface QueryBuilderModalProps {
  isOpen: boolean;
  initialQuery?: string;
  onClose: () => void;
  onApply: (query: string) => void;
}

export interface CustomAtomRule {
  id: string;
  atom: string;
  operator: string;
  value: string;
  negated: boolean;
}

export const ORDER_BY_OPTIONS = [
  { label: 'Default (Date Added)', value: '' },
  { label: 'Date Added (added)', value: 'added' },
  { label: 'Release Date (released)', value: 'released' },
  { label: 'Random (rand)', value: 'rand' },
  { label: 'BPM (bpm)', value: 'bpm' },
  { label: 'Album (album)', value: 'album' },
];

export const OPERATOR_OPTIONS = [
  { label: '=', value: '=' },
  { label: '>=', value: '>=' },
  { label: '>', value: '>' },
  { label: '<=', value: '<=' },
  { label: '<', value: '<' },
];

export const ATOM_DEFINITIONS = [
  { key: 'artist', label: 'Artist', short: 'a', type: 'text', description: 'Song artist' },
  { key: 'title', label: 'Title', short: 't', type: 'text', description: 'Song title' },
  { key: 'album', label: 'Album', short: 'n', type: 'text', description: 'Album name' },
  { key: 'remixer', label: 'Remixer', short: 'remixer', type: 'text', description: 'Song remixer' },
  { key: 'label', label: 'Label', short: 'l', type: 'text', description: 'Record label' },
  { key: 'curator', label: 'Curator', short: 'c', type: 'text', description: 'Discovery curator' },
  { key: 'comments', label: 'Comments', short: 'comments', type: 'text', description: 'Song comments' },
  { key: 'bpm', label: 'BPM', short: 'bpm', type: 'bpm', description: 'Song BPM (single, span e.g. 120-130, or < > =)' },
  { key: 'rating', label: 'Rating', short: 'r', type: 'number', min: 0, max: 5, description: 'Minimum song rating (0-5)' },
  { key: 'energy', label: 'Energy', short: 'e', type: 'number', min: 0, max: 10, description: 'Song energy level (0-10)' },
  { key: 'year', label: 'Year', short: 'y', type: 'number', description: 'Release year' },
  { key: 'month', label: 'Month', short: 'month', type: 'number', min: 1, max: 12, description: 'Release month (1-12)' },
  { key: 'day', label: 'Day', short: 'day', type: 'number', min: 1, max: 31, description: 'Release day (1-31)' },
  { key: 'limit', label: 'Limit', short: 'limit', type: 'number', description: 'Result count limit' },
  { key: 'trashed', label: 'Trashed', short: 'trashed', type: 'boolean', description: 'Has song been deleted (0 or 1)' },
  { key: 'mixed', label: 'Mixed Album', short: 'm', type: 'boolean', description: 'Is album mixed (0 or 1)' },
  { key: 'order', label: 'Order By', short: 'o', type: 'order', description: 'Order by (rand, released, added, bpm, album)' },
  { key: 'query', label: 'Custom Query', short: 'q', type: 'text', description: 'Custom query predicate' },
];

export function tokenizeQuery(str: string): string[] {
  const matches = str.match(/(?:[^\s"]+|"[^"]*")+/g);
  return matches ? Array.from(matches) : [];
}

export function formatAtomValue(val: string): string {
  const trimmed = val.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed;
  }
  if (/\s/.test(trimmed)) {
    return `"${trimmed.replace(/"/g, '\\"')}"`;
  }
  return trimmed;
}

const QueryBuilderModal: Component<QueryBuilderModalProps> = (props) => {
  // Standard text atom fields
  const [artist, setArtist] = createSignal('');
  const [artistNegated, setArtistNegated] = createSignal(false);

  const [title, setTitle] = createSignal('');
  const [titleNegated, setTitleNegated] = createSignal(false);

  const [album, setAlbum] = createSignal('');
  const [albumNegated, setAlbumNegated] = createSignal(false);

  const [remixer, setRemixer] = createSignal('');
  const [remixerNegated, setRemixerNegated] = createSignal(false);

  const [label, setLabel] = createSignal('');
  const [labelNegated, setLabelNegated] = createSignal(false);

  const [curator, setCurator] = createSignal('');
  const [curatorNegated, setCuratorNegated] = createSignal(false);

  const [comments, setComments] = createSignal('');
  const [commentsNegated, setCommentsNegated] = createSignal(false);

  // BPM
  const [bpmMode, setBpmMode] = createSignal<'single' | 'range' | 'operator'>('single');
  const [bpmValue, setBpmValue] = createSignal('');
  const [bpmMin, setBpmMin] = createSignal('');
  const [bpmMax, setBpmMax] = createSignal('');
  const [bpmOperator, setBpmOperator] = createSignal('>=');
  const [bpmNegated, setBpmNegated] = createSignal(false);

  // Numeric fields with operators
  const [rating, setRating] = createSignal('');
  const [ratingOperator, setRatingOperator] = createSignal('>=');
  const [ratingNegated, setRatingNegated] = createSignal(false);

  const [energy, setEnergy] = createSignal('');
  const [energyOperator, setEnergyOperator] = createSignal('=');
  const [energyNegated, setEnergyNegated] = createSignal(false);

  const [year, setYear] = createSignal('');
  const [yearOperator, setYearOperator] = createSignal('=');
  const [yearNegated, setYearNegated] = createSignal(false);

  const [month, setMonth] = createSignal('');
  const [monthNegated, setMonthNegated] = createSignal(false);

  const [day, setDay] = createSignal('');
  const [dayNegated, setDayNegated] = createSignal(false);

  const [limit, setLimit] = createSignal('');

  // Boolean fields
  const [trashed, setTrashed] = createSignal<'none' | '1' | '0'>('none');
  const [trashedNegated, setTrashedNegated] = createSignal(false);

  const [mixed, setMixed] = createSignal<'none' | '1' | '0'>('none');
  const [mixedNegated, setMixedNegated] = createSignal(false);

  // Order By
  const [orderBy, setOrderBy] = createSignal('');

  // Custom / Free-form rule atoms
  const [customRules, setCustomRules] = createSignal<CustomAtomRule[]>([]);
  const [rawTextQuery, setRawTextQuery] = createSignal('');

  const [isCopied, setIsCopied] = createSignal(false);
  const [activeTab, setActiveTab] = createSignal<'basic' | 'music' | 'album' | 'advanced'>('basic');

  const resetAll = () => {
    setArtist('');
    setArtistNegated(false);
    setTitle('');
    setTitleNegated(false);
    setAlbum('');
    setAlbumNegated(false);
    setRemixer('');
    setRemixerNegated(false);
    setLabel('');
    setLabelNegated(false);
    setCurator('');
    setCuratorNegated(false);
    setComments('');
    setCommentsNegated(false);

    setBpmMode('single');
    setBpmValue('');
    setBpmMin('');
    setBpmMax('');
    setBpmOperator('>=');
    setBpmNegated(false);

    setRating('');
    setRatingOperator('>=');
    setRatingNegated(false);

    setEnergy('');
    setEnergyOperator('=');
    setEnergyNegated(false);

    setYear('');
    setYearOperator('=');
    setYearNegated(false);

    setMonth('');
    setMonthNegated(false);
    setDay('');
    setDayNegated(false);

    setLimit('');
    setTrashed('none');
    setTrashedNegated(false);
    setMixed('none');
    setMixedNegated(false);

    setOrderBy('');
    setCustomRules([]);
    setRawTextQuery('');
    setIsCopied(false);
  };

  // Parse existing query when modal is opened
  const loadQueryIntoState = (query: string) => {
    resetAll();
    if (!query || !query.trim()) {
      return;
    }

    const tokens = tokenizeQuery(query);
    const unhandledTokens: string[] = [];

    const atomRegex = /^(-)?((id|a|artist|t|title|remixer|r|rating|comments|c|curator|e|energy|bpm|trashed|lowq|aid|n|album|m|mixed|l|label|y|year|month|day|q|query|limit|o|order|orderby|orderBy):)?(<|>)?(=)?(.+)$/i;

    for (const token of tokens) {
      const match = token.match(atomRegex);
      if (!match) {
        unhandledTokens.push(token);
        continue;
      }

      const isNeg = !!match[1];
      const atomKey = match[3]?.toLowerCase();
      const ltGt = match[4] || '';
      const eq = match[5] || '';
      const op = ltGt + eq;
      let rawVal = match[6];
      if (rawVal.startsWith('"') && rawVal.endsWith('"')) {
        rawVal = rawVal.slice(1, -1);
      }

      if (!atomKey) {
        // Free text search term
        unhandledTokens.push(token);
        continue;
      }

      switch (atomKey) {
        case 'a':
        case 'artist':
          setArtist(rawVal);
          setArtistNegated(isNeg);
          break;
        case 't':
        case 'title':
          setTitle(rawVal);
          setTitleNegated(isNeg);
          break;
        case 'n':
        case 'album':
          setAlbum(rawVal);
          setAlbumNegated(isNeg);
          break;
        case 'remixer':
          setRemixer(rawVal);
          setRemixerNegated(isNeg);
          break;
        case 'l':
        case 'label':
          if (/^\d+$/.test(rawVal) && !op) {
            setLimit(rawVal);
          } else {
            setLabel(rawVal);
            setLabelNegated(isNeg);
          }
          break;
        case 'c':
        case 'curator':
          setCurator(rawVal);
          setCuratorNegated(isNeg);
          break;
        case 'comments':
          setComments(rawVal);
          setCommentsNegated(isNeg);
          break;
        case 'r':
        case 'rating':
          setRating(rawVal);
          if (op) setRatingOperator(op);
          setRatingNegated(isNeg);
          break;
        case 'e':
        case 'energy':
          setEnergy(rawVal);
          if (op) setEnergyOperator(op);
          setEnergyNegated(isNeg);
          break;
        case 'bpm':
          if (rawVal.includes('-')) {
            const [min, max] = rawVal.split('-');
            setBpmMode('range');
            setBpmMin(min || '');
            setBpmMax(max || '');
          } else if (op) {
            setBpmMode('operator');
            setBpmOperator(op);
            setBpmValue(rawVal);
          } else {
            setBpmMode('single');
            setBpmValue(rawVal);
          }
          setBpmNegated(isNeg);
          break;
        case 'trashed':
          setTrashed(rawVal === '1' ? '1' : rawVal === '0' ? '0' : 'none');
          setTrashedNegated(isNeg);
          break;
        case 'm':
        case 'mixed':
          setMixed(rawVal === '1' ? '1' : rawVal === '0' ? '0' : 'none');
          setMixedNegated(isNeg);
          break;
        case 'y':
        case 'year':
          setYear(rawVal);
          if (op) setYearOperator(op);
          setYearNegated(isNeg);
          break;
        case 'month':
          setMonth(rawVal);
          setMonthNegated(isNeg);
          break;
        case 'day':
          setDay(rawVal);
          setDayNegated(isNeg);
          break;
        case 'limit':
          setLimit(rawVal);
          break;
        case 'o':
        case 'order':
        case 'orderby':
          setOrderBy(rawVal.toLowerCase());
          break;
        default:
          unhandledTokens.push(token);
          break;
      }
    }

    if (unhandledTokens.length > 0) {
      setRawTextQuery(unhandledTokens.join(' '));
    }
  };

  createRenderEffect(() => {
    if (props.isOpen) {
      loadQueryIntoState(props.initialQuery || '');
    }
  });

  // Compile atoms into full query string
  const compileQuery = (): string => {
    const atoms: string[] = [];

    // Free text
    if (rawTextQuery().trim()) {
      atoms.push(rawTextQuery().trim());
    }

    // Artist
    if (artist().trim()) {
      const prefix = artistNegated() ? '-' : '';
      atoms.push(`${prefix}artist:${formatAtomValue(artist())}`);
    }

    // Title
    if (title().trim()) {
      const prefix = titleNegated() ? '-' : '';
      atoms.push(`${prefix}title:${formatAtomValue(title())}`);
    }

    // Album
    if (album().trim()) {
      const prefix = albumNegated() ? '-' : '';
      atoms.push(`${prefix}album:${formatAtomValue(album())}`);
    }

    // Remixer
    if (remixer().trim()) {
      const prefix = remixerNegated() ? '-' : '';
      atoms.push(`${prefix}remixer:${formatAtomValue(remixer())}`);
    }

    // Label
    if (label().trim()) {
      const prefix = labelNegated() ? '-' : '';
      atoms.push(`${prefix}label:${formatAtomValue(label())}`);
    }

    // Curator
    if (curator().trim()) {
      const prefix = curatorNegated() ? '-' : '';
      atoms.push(`${prefix}curator:${formatAtomValue(curator())}`);
    }

    // Comments
    if (comments().trim()) {
      const prefix = commentsNegated() ? '-' : '';
      atoms.push(`${prefix}comments:${formatAtomValue(comments())}`);
    }

    // BPM
    const bpmNeg = bpmNegated() ? '-' : '';
    if (bpmMode() === 'range' && (bpmMin().trim() || bpmMax().trim())) {
      const min = bpmMin().trim() || '0';
      const max = bpmMax().trim() || '200';
      atoms.push(`${bpmNeg}bpm:${min}-${max}`);
    } else if (bpmMode() === 'operator' && bpmValue().trim()) {
      const op = bpmOperator() === '=' ? '' : bpmOperator();
      atoms.push(`${bpmNeg}bpm:${op}${bpmValue().trim()}`);
    } else if (bpmMode() === 'single' && bpmValue().trim()) {
      atoms.push(`${bpmNeg}bpm:${bpmValue().trim()}`);
    }

    // Rating
    if (rating().trim()) {
      const prefix = ratingNegated() ? '-' : '';
      const op = ratingOperator() === '=' ? '' : ratingOperator();
      atoms.push(`${prefix}rating:${op}${rating().trim()}`);
    }

    // Energy
    if (energy().trim()) {
      const prefix = energyNegated() ? '-' : '';
      const op = energyOperator() === '=' ? '' : energyOperator();
      atoms.push(`${prefix}energy:${op}${energy().trim()}`);
    }

    // Year
    if (year().trim()) {
      const prefix = yearNegated() ? '-' : '';
      const op = yearOperator() === '=' ? '' : yearOperator();
      atoms.push(`${prefix}year:${op}${year().trim()}`);
    }

    // Month
    if (month().trim()) {
      const prefix = monthNegated() ? '-' : '';
      atoms.push(`${prefix}month:${month().trim()}`);
    }

    // Day
    if (day().trim()) {
      const prefix = dayNegated() ? '-' : '';
      atoms.push(`${prefix}day:${day().trim()}`);
    }

    // Limit
    if (limit().trim()) {
      atoms.push(`limit:${limit().trim()}`);
    }

    // Trashed
    if (trashed() !== 'none') {
      const prefix = trashedNegated() ? '-' : '';
      atoms.push(`${prefix}trashed:${trashed()}`);
    }

    // Mixed
    if (mixed() !== 'none') {
      const prefix = mixedNegated() ? '-' : '';
      atoms.push(`${prefix}mixed:${mixed()}`);
    }

    // Order By
    if (orderBy()) {
      atoms.push(`order:${orderBy()}`);
    }

    // Custom Rules
    for (const rule of customRules()) {
      if (rule.atom && rule.value.trim()) {
        const prefix = rule.negated ? '-' : '';
        const op = rule.operator === '=' ? '' : rule.operator;
        atoms.push(`${prefix}${rule.atom}:${op}${formatAtomValue(rule.value)}`);
      }
    }

    return atoms.join(' ');
  };

  const previewQuery = createMemo(() => compileQuery());

  const handleApply = () => {
    const finalQuery = previewQuery();
    props.onApply(finalQuery);
    props.onClose();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(previewQuery());
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy to clipboard', e);
    }
  };

  const addCustomRule = () => {
    const newRule: CustomAtomRule = {
      id: Math.random().toString(36).substring(2, 9),
      atom: 'artist',
      operator: '=',
      value: '',
      negated: false,
    };
    setCustomRules([...customRules(), newRule]);
  };

  const removeCustomRule = (id: string) => {
    setCustomRules(customRules().filter(r => r.id !== id));
  };

  const updateCustomRule = (id: string, updates: Partial<CustomAtomRule>) => {
    setCustomRules(customRules().map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const cardClickHandler = (event: MouseEvent) => {
    event.stopPropagation();
  };

  return (
    <Show when={props.isOpen}>
      <Backdrop show={props.isOpen} onClick={props.onClose} />
      <div class="fixed inset-0 z-[100] overflow-y-auto pointer-events-none flex items-start justify-center p-2 sm:p-4 pt-12 md:pt-16">
        <div
          class="card w-full max-w-3xl bg-base-200 shadow-2xl pointer-events-auto border border-base-300 max-h-[90vh] flex flex-col"
          onClick={cardClickHandler}
        >
          {/* Header */}
          <div class="card-header px-6 pt-5 pb-3 flex items-center justify-between border-b border-base-300">
            <div class="flex items-center gap-2">
              <div class="p-2 rounded-lg bg-primary/10 text-primary">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-bold text-base-content leading-tight">Query Builder</h2>
                <p class="text-xs text-base-content/60">Construct advanced searches using search atoms</p>
              </div>
            </div>
            <button
              type="button"
              class="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content"
              onClick={props.onClose}
              aria-label="Close query builder"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Live Preview Box */}
          <div class="px-6 pt-4 pb-2 bg-base-300/40 border-b border-base-300">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs font-semibold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                Constructed Query Preview
              </span>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="btn btn-ghost btn-xs text-xs gap-1"
                  onClick={handleCopy}
                  title="Copy search query"
                >
                  <Show when={isCopied()} fallback={
                    <>
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy
                    </>
                  }>
                    <svg class="w-3.5 h-3.5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </Show>
                </button>
                <button
                  type="button"
                  class="btn btn-ghost btn-xs text-xs text-error/80 hover:text-error"
                  onClick={resetAll}
                >
                  Reset All
                </button>
              </div>
            </div>
            <div class="bg-base-100 p-2.5 rounded-lg border border-base-300 font-mono text-sm break-all select-all min-h-[42px] flex items-center">
              <Show when={previewQuery()} fallback={<span class="text-base-content/40 italic font-sans text-xs">No filter conditions set. Query will match all songs.</span>}>
                <span class="text-primary font-medium">{previewQuery()}</span>
              </Show>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div class="px-6 pt-3 pb-1 border-b border-base-300 flex gap-2 overflow-x-auto">
            <button
              type="button"
              class={`btn btn-xs sm:btn-sm font-medium ${activeTab() === 'basic' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('basic')}
            >
              General Info
            </button>
            <button
              type="button"
              class={`btn btn-xs sm:btn-sm font-medium ${activeTab() === 'music' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('music')}
            >
              Musical & Attributes
            </button>
            <button
              type="button"
              class={`btn btn-xs sm:btn-sm font-medium ${activeTab() === 'album' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('album')}
            >
              Album & Release
            </button>
            <button
              type="button"
              class={`btn btn-xs sm:btn-sm font-medium ${activeTab() === 'advanced' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('advanced')}
            >
              Sorting & Custom Rules
            </button>
          </div>

          {/* Body Content */}
          <div class="p-6 overflow-y-auto flex-1 space-y-4">
            {/* TAB 1: General Info */}
            <Show when={activeTab() === 'basic'}>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Artist */}
                <div class="form-control">
                  <div class="flex items-center justify-between mb-1">
                    <label class="label-text font-semibold flex items-center gap-1.5">
                      Artist <span class="badge badge-xs font-mono">artist:</span>
                    </label>
                    <label class="label-text-alt flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        class="checkbox checkbox-xs checkbox-error"
                        checked={artistNegated()}
                        onChange={(e) => setArtistNegated(e.currentTarget.checked)}
                      />
                      <span class="text-xs text-base-content/70">NOT (-)</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Daft Punk"
                    value={artist()}
                    onInput={(e) => setArtist(e.currentTarget.value)}
                    class="input input-bordered input-sm w-full"
                  />
                </div>

                {/* Title */}
                <div class="form-control">
                  <div class="flex items-center justify-between mb-1">
                    <label class="label-text font-semibold flex items-center gap-1.5">
                      Title <span class="badge badge-xs font-mono">title:</span>
                    </label>
                    <label class="label-text-alt flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        class="checkbox checkbox-xs checkbox-error"
                        checked={titleNegated()}
                        onChange={(e) => setTitleNegated(e.currentTarget.checked)}
                      />
                      <span class="text-xs text-base-content/70">NOT (-)</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. One More Time"
                    value={title()}
                    onInput={(e) => setTitle(e.currentTarget.value)}
                    class="input input-bordered input-sm w-full"
                  />
                </div>

                {/* Remixer */}
                <div class="form-control">
                  <div class="flex items-center justify-between mb-1">
                    <label class="label-text font-semibold flex items-center gap-1.5">
                      Remixer <span class="badge badge-xs font-mono">remixer:</span>
                    </label>
                    <label class="label-text-alt flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        class="checkbox checkbox-xs checkbox-error"
                        checked={remixerNegated()}
                        onChange={(e) => setRemixerNegated(e.currentTarget.checked)}
                      />
                      <span class="text-xs text-base-content/70">NOT (-)</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Romanthony"
                    value={remixer()}
                    onInput={(e) => setRemixer(e.currentTarget.value)}
                    class="input input-bordered input-sm w-full"
                  />
                </div>

                {/* Curator */}
                <div class="form-control">
                  <div class="flex items-center justify-between mb-1">
                    <label class="label-text font-semibold flex items-center gap-1.5">
                      Curator <span class="badge badge-xs font-mono">curator:</span>
                    </label>
                    <label class="label-text-alt flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        class="checkbox checkbox-xs checkbox-error"
                        checked={curatorNegated()}
                        onChange={(e) => setCuratorNegated(e.currentTarget.checked)}
                      />
                      <span class="text-xs text-base-content/70">NOT (-)</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="Discovery curator"
                    value={curator()}
                    onInput={(e) => setCurator(e.currentTarget.value)}
                    class="input input-bordered input-sm w-full"
                  />
                </div>

                {/* Comments */}
                <div class="form-control md:col-span-2">
                  <div class="flex items-center justify-between mb-1">
                    <label class="label-text font-semibold flex items-center gap-1.5">
                      Comments <span class="badge badge-xs font-mono">comments:</span>
                    </label>
                    <label class="label-text-alt flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        class="checkbox checkbox-xs checkbox-error"
                        checked={commentsNegated()}
                        onChange={(e) => setCommentsNegated(e.currentTarget.checked)}
                      />
                      <span class="text-xs text-base-content/70">NOT (-)</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="Search song notes / comments"
                    value={comments()}
                    onInput={(e) => setComments(e.currentTarget.value)}
                    class="input input-bordered input-sm w-full"
                  />
                </div>

                {/* Free Text / Keywords */}
                <div class="form-control md:col-span-2">
                  <label class="label-text font-semibold mb-1 flex items-center gap-1.5">
                    Free Text Search Words <span class="text-xs font-normal text-base-content/60">(matches title, artist, comments)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. disco upbeat"
                    value={rawTextQuery()}
                    onInput={(e) => setRawTextQuery(e.currentTarget.value)}
                    class="input input-bordered input-sm w-full"
                  />
                </div>
              </div>
            </Show>

            {/* TAB 2: Musical & Attributes */}
            <Show when={activeTab() === 'music'}>
              <div class="space-y-4">
                {/* BPM Section */}
                <div class="p-4 bg-base-100 rounded-lg border border-base-300">
                  <div class="flex items-center justify-between mb-3">
                    <span class="font-semibold text-sm flex items-center gap-1.5">
                      BPM (Tempo) <span class="badge badge-xs font-mono">bpm:</span>
                    </span>
                    <label class="label-text-alt flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        class="checkbox checkbox-xs checkbox-error"
                        checked={bpmNegated()}
                        onChange={(e) => setBpmNegated(e.currentTarget.checked)}
                      />
                      <span class="text-xs text-base-content/70">NOT (-)</span>
                    </label>
                  </div>

                  <div class="flex flex-wrap gap-2 mb-3">
                    <button
                      type="button"
                      class={`btn btn-xs ${bpmMode() === 'single' ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setBpmMode('single')}
                    >
                      Exact / Single
                    </button>
                    <button
                      type="button"
                      class={`btn btn-xs ${bpmMode() === 'range' ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setBpmMode('range')}
                    >
                      Span Range (e.g. 120-130)
                    </button>
                    <button
                      type="button"
                      class={`btn btn-xs ${bpmMode() === 'operator' ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setBpmMode('operator')}
                    >
                      Comparison (&gt;, &lt;, &gt;=, &lt;=)
                    </button>
                  </div>

                  <Show when={bpmMode() === 'single'}>
                    <input
                      type="number"
                      placeholder="e.g. 128"
                      value={bpmValue()}
                      onInput={(e) => setBpmValue(e.currentTarget.value)}
                      class="input input-bordered input-sm w-full max-w-xs"
                    />
                  </Show>

                  <Show when={bpmMode() === 'range'}>
                    <div class="flex items-center gap-2 max-w-sm">
                      <input
                        type="number"
                        placeholder="Min BPM (e.g. 120)"
                        value={bpmMin()}
                        onInput={(e) => setBpmMin(e.currentTarget.value)}
                        class="input input-bordered input-sm w-full"
                      />
                      <span class="text-base-content/60 font-bold">-</span>
                      <input
                        type="number"
                        placeholder="Max BPM (e.g. 130)"
                        value={bpmMax()}
                        onInput={(e) => setBpmMax(e.currentTarget.value)}
                        class="input input-bordered input-sm w-full"
                      />
                    </div>
                  </Show>

                  <Show when={bpmMode() === 'operator'}>
                    <div class="flex items-center gap-2 max-w-xs">
                      <select
                        class="select select-bordered select-sm w-24"
                        value={bpmOperator()}
                        onChange={(e) => setBpmOperator(e.currentTarget.value)}
                      >
                        <For each={OPERATOR_OPTIONS}>
                          {(op) => <option value={op.value}>{op.label}</option>}
                        </For>
                      </select>
                      <input
                        type="number"
                        placeholder="BPM value"
                        value={bpmValue()}
                        onInput={(e) => setBpmValue(e.currentTarget.value)}
                        class="input input-bordered input-sm flex-1"
                      />
                    </div>
                  </Show>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Rating */}
                  <div class="p-4 bg-base-100 rounded-lg border border-base-300">
                    <div class="flex items-center justify-between mb-2">
                      <label class="label-text font-semibold flex items-center gap-1.5">
                        Rating <span class="badge badge-xs font-mono">rating:</span>
                      </label>
                      <label class="label-text-alt flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          class="checkbox checkbox-xs checkbox-error"
                          checked={ratingNegated()}
                          onChange={(e) => setRatingNegated(e.currentTarget.checked)}
                        />
                        <span class="text-xs text-base-content/70">NOT (-)</span>
                      </label>
                    </div>
                    <div class="flex items-center gap-2">
                      <select
                        class="select select-bordered select-sm w-20"
                        value={ratingOperator()}
                        onChange={(e) => setRatingOperator(e.currentTarget.value)}
                      >
                        <For each={OPERATOR_OPTIONS}>
                          {(op) => <option value={op.value}>{op.label}</option>}
                        </For>
                      </select>
                      <select
                        class="select select-bordered select-sm flex-1"
                        value={rating()}
                        onChange={(e) => setRating(e.currentTarget.value)}
                      >
                        <option value="">Any Rating</option>
                        <option value="0">0 Stars</option>
                        <option value="1">1 Star</option>
                        <option value="2">2 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="5">5 Stars</option>
                      </select>
                    </div>
                  </div>

                  {/* Energy */}
                  <div class="p-4 bg-base-100 rounded-lg border border-base-300">
                    <div class="flex items-center justify-between mb-2">
                      <label class="label-text font-semibold flex items-center gap-1.5">
                        Energy <span class="badge badge-xs font-mono">energy:</span>
                      </label>
                      <label class="label-text-alt flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          class="checkbox checkbox-xs checkbox-error"
                          checked={energyNegated()}
                          onChange={(e) => setEnergyNegated(e.currentTarget.checked)}
                        />
                        <span class="text-xs text-base-content/70">NOT (-)</span>
                      </label>
                    </div>
                    <div class="flex items-center gap-2">
                      <select
                        class="select select-bordered select-sm w-20"
                        value={energyOperator()}
                        onChange={(e) => setEnergyOperator(e.currentTarget.value)}
                      >
                        <For each={OPERATOR_OPTIONS}>
                          {(op) => <option value={op.value}>{op.label}</option>}
                        </For>
                      </select>
                      <select
                        class="select select-bordered select-sm flex-1"
                        value={energy()}
                        onChange={(e) => setEnergy(e.currentTarget.value)}
                      >
                        <option value="">Any Energy</option>
                        <option value="0">0 (Very Chill)</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5 (Medium)</option>
                        <option value="6">6</option>
                        <option value="7">7</option>
                        <option value="8">8</option>
                        <option value="9">9</option>
                        <option value="10">10 (Peak High)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </Show>

            {/* TAB 3: Album & Release */}
            <Show when={activeTab() === 'album'}>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Album Name */}
                <div class="form-control">
                  <div class="flex items-center justify-between mb-1">
                    <label class="label-text font-semibold flex items-center gap-1.5">
                      Album Name <span class="badge badge-xs font-mono">album:</span>
                    </label>
                    <label class="label-text-alt flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        class="checkbox checkbox-xs checkbox-error"
                        checked={albumNegated()}
                        onChange={(e) => setAlbumNegated(e.currentTarget.checked)}
                      />
                      <span class="text-xs text-base-content/70">NOT (-)</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Discovery"
                    value={album()}
                    onInput={(e) => setAlbum(e.currentTarget.value)}
                    class="input input-bordered input-sm w-full"
                  />
                </div>

                {/* Label */}
                <div class="form-control">
                  <div class="flex items-center justify-between mb-1">
                    <label class="label-text font-semibold flex items-center gap-1.5">
                      Record Label <span class="badge badge-xs font-mono">label:</span>
                    </label>
                    <label class="label-text-alt flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        class="checkbox checkbox-xs checkbox-error"
                        checked={labelNegated()}
                        onChange={(e) => setLabelNegated(e.currentTarget.checked)}
                      />
                      <span class="text-xs text-base-content/70">NOT (-)</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Virgin"
                    value={label()}
                    onInput={(e) => setLabel(e.currentTarget.value)}
                    class="input input-bordered input-sm w-full"
                  />
                </div>

                {/* Release Year */}
                <div class="form-control">
                  <div class="flex items-center justify-between mb-1">
                    <label class="label-text font-semibold flex items-center gap-1.5">
                      Release Year <span class="badge badge-xs font-mono">year:</span>
                    </label>
                    <label class="label-text-alt flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        class="checkbox checkbox-xs checkbox-error"
                        checked={yearNegated()}
                        onChange={(e) => setYearNegated(e.currentTarget.checked)}
                      />
                      <span class="text-xs text-base-content/70">NOT (-)</span>
                    </label>
                  </div>
                  <div class="flex items-center gap-2">
                    <select
                      class="select select-bordered select-sm w-20"
                      value={yearOperator()}
                      onChange={(e) => setYearOperator(e.currentTarget.value)}
                    >
                      <For each={OPERATOR_OPTIONS}>
                        {(op) => <option value={op.value}>{op.label}</option>}
                      </For>
                    </select>
                    <input
                      type="number"
                      placeholder="e.g. 2001"
                      value={year()}
                      onInput={(e) => setYear(e.currentTarget.value)}
                      class="input input-bordered input-sm flex-1"
                    />
                  </div>
                </div>

                {/* Release Month & Day */}
                <div class="grid grid-cols-2 gap-2">
                  <div class="form-control">
                    <div class="flex items-center justify-between mb-1">
                      <label class="label-text font-semibold flex items-center gap-1.5">
                        Month <span class="badge badge-xs font-mono">month:</span>
                      </label>
                      <label class="label-text-alt flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          class="checkbox checkbox-xs checkbox-error"
                          checked={monthNegated()}
                          onChange={(e) => setMonthNegated(e.currentTarget.checked)}
                        />
                        <span class="text-xs text-base-content/70">NOT</span>
                      </label>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      placeholder="1-12"
                      value={month()}
                      onInput={(e) => setMonth(e.currentTarget.value)}
                      class="input input-bordered input-sm w-full"
                    />
                  </div>

                  <div class="form-control">
                    <div class="flex items-center justify-between mb-1">
                      <label class="label-text font-semibold flex items-center gap-1.5">
                        Day <span class="badge badge-xs font-mono">day:</span>
                      </label>
                      <label class="label-text-alt flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          class="checkbox checkbox-xs checkbox-error"
                          checked={dayNegated()}
                          onChange={(e) => setDayNegated(e.currentTarget.checked)}
                        />
                        <span class="text-xs text-base-content/70">NOT</span>
                      </label>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="1-31"
                      value={day()}
                      onInput={(e) => setDay(e.currentTarget.value)}
                      class="input input-bordered input-sm w-full"
                    />
                  </div>
                </div>

                {/* Mixed Album */}
                <div class="p-3 bg-base-100 rounded-lg border border-base-300 flex items-center justify-between">
                  <div>
                    <span class="font-semibold text-sm block">Mixed Album <span class="badge badge-xs font-mono">mixed:</span></span>
                    <span class="text-xs text-base-content/60">Is continuous DJ mix album</span>
                  </div>
                  <select
                    class="select select-bordered select-sm w-28"
                    value={mixed()}
                    onChange={(e) => setMixed(e.currentTarget.value as any)}
                  >
                    <option value="none">Any</option>
                    <option value="1">Mixed (1)</option>
                    <option value="0">Unmixed (0)</option>
                  </select>
                </div>

                {/* Trashed Status */}
                <div class="p-3 bg-base-100 rounded-lg border border-base-300 flex items-center justify-between">
                  <div>
                    <span class="font-semibold text-sm block">Trashed Songs <span class="badge badge-xs font-mono">trashed:</span></span>
                    <span class="text-xs text-base-content/60">Filter songs marked as deleted</span>
                  </div>
                  <select
                    class="select select-bordered select-sm w-28"
                    value={trashed()}
                    onChange={(e) => setTrashed(e.currentTarget.value as any)}
                  >
                    <option value="none">Any</option>
                    <option value="0">Active (0)</option>
                    <option value="1">Trashed (1)</option>
                  </select>
                </div>
              </div>
            </Show>

            {/* TAB 4: Sorting & Advanced Custom Rules */}
            <Show when={activeTab() === 'advanced'}>
              <div class="space-y-4">
                {/* Order By & Limit */}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-base-100 rounded-lg border border-base-300">
                  <div class="form-control">
                    <label class="label-text font-semibold mb-1 flex items-center gap-1.5">
                      Order By <span class="badge badge-xs font-mono">order:</span>
                    </label>
                    <select
                      class="select select-bordered select-sm w-full"
                      value={orderBy()}
                      onChange={(e) => setOrderBy(e.currentTarget.value)}
                    >
                      <For each={ORDER_BY_OPTIONS}>
                        {(opt) => <option value={opt.value}>{opt.label}</option>}
                      </For>
                    </select>
                  </div>

                  <div class="form-control">
                    <label class="label-text font-semibold mb-1 flex items-center gap-1.5">
                      Result Limit <span class="badge badge-xs font-mono">limit:</span>
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 50"
                      value={limit()}
                      onInput={(e) => setLimit(e.currentTarget.value)}
                      class="input input-bordered input-sm w-full"
                    />
                  </div>
                </div>

                {/* Dynamic Custom Rules */}
                <div class="p-4 bg-base-100 rounded-lg border border-base-300">
                  <div class="flex items-center justify-between mb-3">
                    <div>
                      <h4 class="font-semibold text-sm">Additional Search Atoms</h4>
                      <p class="text-xs text-base-content/60">Add custom atom rules with flexible operators and negations</p>
                    </div>
                    <button
                      type="button"
                      class="btn btn-xs btn-primary gap-1"
                      onClick={addCustomRule}
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Add Atom
                    </button>
                  </div>

                  <Show when={customRules().length > 0} fallback={
                    <div class="text-xs text-base-content/50 text-center py-4 border border-dashed border-base-300 rounded">
                      No additional custom atoms added. Click "+ Add Atom" to add extra criteria.
                    </div>
                  }>
                    <div class="space-y-2">
                      <For each={customRules()}>
                        {(rule) => (
                          <div class="flex flex-wrap items-center gap-2 p-2 rounded bg-base-200 border border-base-300">
                            {/* Negation Toggle */}
                            <label class="label-text-alt flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                class="checkbox checkbox-xs checkbox-error"
                                checked={rule.negated}
                                onChange={(e) => updateCustomRule(rule.id, { negated: e.currentTarget.checked })}
                              />
                              <span class="text-xs">NOT</span>
                            </label>

                            {/* Atom Selector */}
                            <select
                              class="select select-bordered select-xs w-32"
                              value={rule.atom}
                              onChange={(e) => updateCustomRule(rule.id, { atom: e.currentTarget.value })}
                            >
                              <For each={ATOM_DEFINITIONS}>
                                {(def) => <option value={def.key}>{def.label} ({def.key}:)</option>}
                              </For>
                            </select>

                            {/* Operator */}
                            <select
                              class="select select-bordered select-xs w-16"
                              value={rule.operator}
                              onChange={(e) => updateCustomRule(rule.id, { operator: e.currentTarget.value })}
                            >
                              <For each={OPERATOR_OPTIONS}>
                                {(op) => <option value={op.value}>{op.label}</option>}
                              </For>
                            </select>

                            {/* Value Input */}
                            <input
                              type="text"
                              placeholder="Value"
                              value={rule.value}
                              onInput={(e) => updateCustomRule(rule.id, { value: e.currentTarget.value })}
                              class="input input-bordered input-xs flex-1 min-w-[120px]"
                            />

                            {/* Remove Button */}
                            <button
                              type="button"
                              class="btn btn-ghost btn-xs btn-circle text-error"
                              onClick={() => removeCustomRule(rule.id)}
                              title="Remove atom rule"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </For>
                    </div>
                  </Show>
                </div>
              </div>
            </Show>
          </div>

          {/* Footer Actions */}
          <div class="card-footer px-6 py-4 bg-base-200 border-t border-base-300 flex items-center justify-between">
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              onClick={props.onClose}
            >
              Cancel
            </button>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="btn btn-primary btn-sm px-6 gap-2"
                onClick={handleApply}
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Apply Search
              </button>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default QueryBuilderModal;
