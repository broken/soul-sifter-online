import { Component, createSignal, createRenderEffect, For, Show } from 'solid-js';
import Backdrop from './Backdrop';

export interface QueryBuilderModalProps {
  isOpen: boolean;
  initialQuery?: string;
  onClose: () => void;
  onApply: (query: string) => void;
}

export interface TagItem {
  prefix: string;
  label: string;
  description?: string;
  type?: 'atom' | 'modifier' | 'preset';
}

export const TAG_GROUPS: { name: string; tags: TagItem[] }[] = [
  {
    name: 'Song Information',
    tags: [
      { prefix: 'a:', label: 'artist:', description: 'Song artist (a:)' },
      { prefix: 't:', label: 'title:', description: 'Song title (t:)' },
      { prefix: 'n:', label: 'album:', description: 'Album name (n:)' },
      { prefix: 'remixer:', label: 'remixer:', description: 'Song remixer' },
      { prefix: 'l:', label: 'label:', description: 'Record label (l:)' },
      { prefix: 'c:', label: 'curator:', description: 'Discovery curator (c:)' },
      { prefix: 'comments:', label: 'comments:', description: 'Song comments' },
    ],
  },
  {
    name: 'Music & Attributes',
    tags: [
      { prefix: 'bpm:', label: 'bpm:', description: 'Song BPM (single e.g. 128 or span 120-130)' },
      { prefix: 'r:', label: 'rating:', description: 'Minimum song rating 0-5 (r:)' },
      { prefix: 'e:', label: 'energy:', description: 'Song energy 0-10 (e:)' },
      { prefix: 'y:', label: 'year:', description: 'Release year (y:)' },
      { prefix: 'month:', label: 'month:', description: 'Release month 1-12' },
      { prefix: 'day:', label: 'day:', description: 'Release day 1-31' },
      { prefix: 'l:', label: 'limit:', description: 'Result count limit (l:)' },
    ],
  },
  {
    name: 'Sorting & Status',
    tags: [
      { prefix: 'o:rand', label: 'order:rand', description: 'Random sort (o:rand)' },
      { prefix: 'o:released', label: 'order:released', description: 'Release date sort (o:released)' },
      { prefix: 'o:added', label: 'order:added', description: 'Date added sort (o:added)' },
      { prefix: 'o:bpm', label: 'order:bpm', description: 'BPM sort (o:bpm)' },
      { prefix: 'o:album', label: 'order:album', description: 'Album sort (o:album)' },
      { prefix: 'trashed:1', label: 'trashed:1', description: 'Deleted songs' },
      { prefix: 'trashed:0', label: 'trashed:0', description: 'Non-deleted songs' },
      { prefix: 'm:1', label: 'mixed:1', description: 'Continuous DJ mixed (m:1)' },
      { prefix: 'm:0', label: 'mixed:0', description: 'Unmixed album (m:0)' },
    ],
  },
  {
    name: 'Modifiers & Operators',
    tags: [
      { prefix: '-', label: '- (NOT)', description: 'Negate query atom' },
      { prefix: '""', label: '"" (Quotes)', description: 'Group multi-word terms' },
      { prefix: '>=', label: '>=', description: 'Greater than or equal' },
      { prefix: '<=', label: '<=', description: 'Less than or equal' },
      { prefix: '>', label: '>', description: 'Greater than' },
      { prefix: '<', label: '<', description: 'Less than' },
      { prefix: '=', label: '=', description: 'Exact equal' },
    ],
  },
];

const QueryBuilderModal: Component<QueryBuilderModalProps> = (props) => {
  const [queryText, setQueryText] = createSignal('');
  let inputRef: HTMLInputElement | undefined;

  createRenderEffect(() => {
    if (props.isOpen) {
      setQueryText(props.initialQuery || '');
    }
  });

  const insertTag = (tagPrefix: string) => {
    const input = inputRef;
    const current = queryText();

    let start = input ? input.selectionStart ?? current.length : current.length;
    let end = input ? input.selectionEnd ?? current.length : current.length;

    let textToInsert = tagPrefix;
    let cursorOffset = tagPrefix.length;

    if (tagPrefix === '""') {
      const selected = current.substring(start, end);
      textToInsert = `"${selected}"`;
      cursorOffset = selected.length > 0 ? textToInsert.length : 1;
    } else {
      const isOperator = /^(>=|<=|>|<|=|[-])$/.test(tagPrefix);
      const endsWithAtomColon = /:$/.test(current.substring(0, start));
      const endsWithNegation = /-$/.test(current.substring(0, start));
      // Add a leading space if needed
      const needsLeadingSpace =
        start > 0 &&
        !/\s$/.test(current.substring(0, start)) &&
        !isOperator &&
        !endsWithAtomColon &&
        !endsWithNegation;

      if (needsLeadingSpace) {
        textToInsert = ` ${textToInsert}`;
        cursorOffset += 1;
      }
    }

    const nextText = current.substring(0, start) + textToInsert + current.substring(end);
    setQueryText(nextText);

    // Keep focus and position cursor
    if (input) {
      setTimeout(() => {
        input.focus();
        const nextPos = start + cursorOffset;
        input.setSelectionRange(nextPos, nextPos);
      }, 0);
    }
  };

  const handleApply = () => {
    props.onApply(queryText().trim());
    props.onClose();
  };

  const handleClear = () => {
    setQueryText('');
    inputRef?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApply();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      props.onClose();
    }
  };

  const cardClickHandler = (event: MouseEvent) => {
    event.stopPropagation();
  };

  return (
    <Show when={props.isOpen}>
      <Backdrop show={props.isOpen} onClick={props.onClose} />
      <div class="fixed inset-0 z-[100] overflow-y-auto pointer-events-none flex items-start justify-center p-3 pt-12 md:pt-16">
        <div
          class="card w-full max-w-2xl bg-base-200 shadow-2xl pointer-events-auto border border-base-300 flex flex-col"
          onClick={cardClickHandler}
        >
          {/* Header */}
          <div class="px-5 py-3 flex items-center justify-between border-b border-base-300">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <h3 class="font-bold text-sm text-base-content">Search Atoms & Query Builder</h3>
            </div>
            <button
              type="button"
              class="btn btn-ghost btn-xs btn-circle text-base-content/60 hover:text-base-content"
              onClick={props.onClose}
              aria-label="Close query builder"
            >
              ✕
            </button>
          </div>

          {/* Search Query Input */}
          <div class="p-4 bg-base-300/30 border-b border-base-300 space-y-2">
            <div class="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                class="input input-bordered input-sm w-full pr-8 font-mono text-sm"
                placeholder="Tap tags below to insert atoms, e.g. artist: bpm:120-130 rating:>=4"
                value={queryText()}
                onInput={(e) => setQueryText(e.currentTarget.value)}
                onKeyDown={handleKeyDown}
                autofocus
              />
              <Show when={queryText()}>
                <button
                  type="button"
                  class="absolute right-2 text-base-content/40 hover:text-base-content text-xs p-1"
                  onClick={handleClear}
                  title="Clear query"
                >
                  ✕
                </button>
              </Show>
            </div>
          </div>

          {/* Tag Cloud Groups */}
          <div class="p-4 space-y-3.5 max-h-[60vh] overflow-y-auto">
            <For each={TAG_GROUPS}>
              {(group) => (
                <div>
                  <span class="text-[11px] font-semibold uppercase tracking-wider text-base-content/50 block mb-1.5">
                    {group.name}
                  </span>
                  <div class="flex flex-wrap gap-1.5">
                    <For each={group.tags}>
                      {(tag) => (
                        <button
                          type="button"
                          class="btn btn-xs btn-ghost bg-base-100 hover:bg-primary hover:text-primary-content border border-base-300 font-mono text-xs transition-colors"
                          onClick={() => insertTag(tag.prefix)}
                          title={tag.description}
                        >
                          {tag.label}
                        </button>
                      )}
                    </For>
                  </div>
                </div>
              )}
            </For>
          </div>

          {/* Footer Actions */}
          <div class="px-4 py-3 bg-base-200 border-t border-base-300 flex items-center justify-between">
            <button
              type="button"
              class="btn btn-ghost btn-xs text-error/80 hover:text-error"
              onClick={handleClear}
            >
              Clear
            </button>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="btn btn-ghost btn-xs"
                onClick={props.onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                class="btn btn-primary btn-sm px-5"
                onClick={handleApply}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default QueryBuilderModal;
