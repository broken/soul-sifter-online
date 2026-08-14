import { Show, For, type Component, createSignal, createEffect, onMount, createMemo } from "solid-js";

import Rating from "./Rating";
import { SongConsumer } from "./SongContext";
import Backdrop from './Backdrop';
import { supabase } from "./App";
import { Style, StyleChildren } from "../model.types";
import { GenreWrapper } from "./GenreListItem";

const StyleTreeItem: Component<{
  genre: GenreWrapper;
  padding: number;
  assignedStyleIds: () => Set<number>;
  onAddStyle: (style: Style) => void;
  searchFilter: string;
}> = (props) => {
  const isAssigned = () => props.assignedStyleIds().has(props.genre.genre.id);
  const hasChildren = () => props.genre.children.length > 0;

  const matchesSearch = () => {
    if (!props.searchFilter) return true;
    const q = props.searchFilter.toLowerCase();
    if ((props.genre.genre.name || '').toLowerCase().includes(q)) return true;
    return props.genre.getAllDescendants().some((d) => (d.name || '').toLowerCase().includes(q));
  };

  // If search filter is active and descendants match, auto-expand
  createEffect(() => {
    if (props.searchFilter) {
      const q = props.searchFilter.toLowerCase();
      const hasMatchingDescendant = props.genre.getAllDescendants().some((d) => (d.name || '').toLowerCase().includes(q));
      if (hasMatchingDescendant) {
        props.genre.collapsed = false;
      }
    }
  });

  return (
    <Show when={matchesSearch()}>
      <div
        class="flex flex-row items-center justify-between py-1 px-2 hover:bg-base-200/60 rounded text-xs"
        style={{ "padding-left": `${props.padding + 4}px` }}
      >
        <div class="flex items-center gap-1 flex-1 min-w-0">
          <Show when={hasChildren()} fallback={<span class="w-4 h-4 inline-block shrink-0" />}>
            <button
              type="button"
              class="btn btn-ghost btn-xs btn-square h-4 w-4 min-h-0 p-0 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                props.genre.collapsed = !props.genre.collapsed;
              }}
              aria-label={props.genre.collapsed ? "Expand" : "Collapse"}
            >
              <Show when={props.genre.collapsed}>
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </Show>
              <Show when={!props.genre.collapsed}>
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </Show>
            </button>
          </Show>

          <span class={`truncate ${isAssigned() ? "opacity-40 line-through" : "font-medium"}`}>
            {props.genre.genre.name}
          </span>
        </div>

        <div class="shrink-0 ml-2">
          <Show
            when={!isAssigned()}
            fallback={<span class="text-[10px] text-base-content/40 italic">Added</span>}
          >
            <button
              type="button"
              class="btn btn-ghost btn-xs h-5 min-h-0 text-primary font-bold px-1.5 hover:bg-primary hover:text-primary-content"
              onClick={() => props.onAddStyle(props.genre.genre)}
              title={`Add ${props.genre.genre.name}`}
            >
              + Add
            </button>
          </Show>
        </div>
      </div>

      <Show when={!props.genre.collapsed && hasChildren()}>
        <For each={props.genre.children}>
          {(child) => (
            <StyleTreeItem
              genre={child}
              padding={props.padding + 16}
              assignedStyleIds={props.assignedStyleIds}
              onAddStyle={props.onAddStyle}
              searchFilter={props.searchFilter}
            />
          )}
        </For>
      </Show>
    </Show>
  );
};

const SongInfo: Component = () => {
  const { song, setSong } = SongConsumer();

  const [genreTree, setGenreTree] = createSignal<GenreWrapper[]>([]);
  const [songStyles, setSongStyles] = createSignal<Style[]>([]);
  const [loadingStyles, setLoadingStyles] = createSignal<boolean>(false);
  const [loadingTree, setLoadingTree] = createSignal<boolean>(false);
  const [showAddMenu, setShowAddMenu] = createSignal<boolean>(false);
  const [isRemoveMode, setIsRemoveMode] = createSignal<boolean>(false);
  const [searchText, setSearchText] = createSignal<string>("");

  const fetchGenreTree = async () => {
    if (genreTree().length > 0) return;
    setLoadingTree(true);

    const addChildren = (genre: GenreWrapper, genres: Style[], children: Record<number, number[]>) => {
      for (let g of genres) {
        if (children[genre.genre.id] && children[genre.genre.id].includes(g.id)) {
          let wrapper = new GenreWrapper(g);
          addChildren(wrapper, genres, children);
          genre.children.push(wrapper);
        }
      }
      return genre;
    };

    try {
      let genreList: Style[] = [];
      const { data: stylesData, error: stylesError } = await supabase.from('styles').select();
      if (stylesError) {
        console.error('Error fetching styles:', stylesError);
        return;
      }
      if (stylesData) {
        genreList = stylesData;
      }
      genreList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      let children: Record<number, number[]> = {};
      let childIds: Record<number, boolean> = {};
      const { data: styleChildrenData, error: styleChildrenError } = await supabase.from('stylechildren').select();
      if (styleChildrenError) {
        console.error('Error fetching stylechildren:', styleChildrenError);
        return;
      }
      if (styleChildrenData) {
        styleChildrenData.forEach((x: StyleChildren) => {
          if (!children[x.parentid]) children[x.parentid] = [];
          children[x.parentid].push(x.childid);
          childIds[x.childid] = true;
        });
      }

      let parentGenres: GenreWrapper[] = genreList.filter((g) => !childIds[g.id]).map((g) => new GenreWrapper(g));
      parentGenres = parentGenres.map((g) => addChildren(g, genreList, children));
      setGenreTree(parentGenres);
    } catch (err) {
      console.error('Failed to load genre tree:', err);
    } finally {
      setLoadingTree(false);
    }
  };

  onMount(() => {
    fetchGenreTree();
  });

  createEffect(async () => {
    const currentSong = song();
    setShowAddMenu(false);
    setIsRemoveMode(false);
    setSearchText("");

    if (!currentSong) {
      setSongStyles([]);
      return;
    }

    setLoadingStyles(true);
    try {
      const { data: songStylesData, error } = await supabase
        .from('songstyles')
        .select('styleid, styles(*)')
        .eq('songid', currentSong.id);

      if (error) {
        console.error('Error fetching song styles:', error);
      } else if (songStylesData) {
        const stylesList: Style[] = songStylesData
          .map((item: any) => item.styles)
          .filter(Boolean)
          .sort((a: Style, b: Style) => (a.name || '').localeCompare(b.name || ''));
        setSongStyles(stylesList);
      }
    } catch (err) {
      console.error('Failed to fetch song styles:', err);
    } finally {
      setLoadingStyles(false);
    }
  });

  const assignedStyleIds = createMemo(() => new Set(songStyles().map((s) => s.id)));

  const handleAddStyle = async (style: Style) => {
    const currentSong = song();
    if (!currentSong) return;

    // Optimistic update
    setSongStyles((prev) => [...prev, style].sort((a, b) => (a.name || '').localeCompare(b.name || '')));

    try {
      const { error } = await supabase.from('songstyles').insert({
        songid: currentSong.id,
        styleid: style.id,
      });

      if (error) {
        console.error('Error adding song style:', error);
        // Revert on error
        setSongStyles((prev) => prev.filter((s) => s.id !== style.id));
      }
    } catch (err) {
      console.error('Failed to add song style:', err);
      setSongStyles((prev) => prev.filter((s) => s.id !== style.id));
    }
  };

  const handleRemoveStyle = async (styleId: number) => {
    const currentSong = song();
    if (!currentSong) return;

    const removed = songStyles().find((s) => s.id === styleId);
    // Optimistic update
    setSongStyles((prev) => prev.filter((s) => s.id !== styleId));

    try {
      const { error } = await supabase
        .from('songstyles')
        .delete()
        .eq('songid', currentSong.id)
        .eq('styleid', styleId);

      if (error) {
        console.error('Error removing song style:', error);
        // Revert on error
        if (removed) {
          setSongStyles((prev) => [...prev, removed].sort((a, b) => (a.name || '').localeCompare(b.name || '')));
        }
      }
    } catch (err) {
      console.error('Failed to remove song style:', err);
      if (removed) {
        setSongStyles((prev) => [...prev, removed].sort((a, b) => (a.name || '').localeCompare(b.name || '')));
      }
    }
  };

  const handleClose = () => {
    setShowAddMenu(false);
    setIsRemoveMode(false);
    setSong(undefined);
  };

  const cardClickHandler = (event: MouseEvent) => {
    event.stopPropagation(); // Prevent clicks inside the card from closing it
  };

  return (
    <Show when={!!song()}>
      <Backdrop show={!!song()} onClick={handleClose} />
      <div
        class="card w-96 max-w-[calc(100vw-2rem)] bg-base-200 shadow-xl m-auto absolute left-0 right-0 top-16 md:top-1/4 max-h-[85vh] overflow-y-auto"
        style={{ 'z-index': '100' }} // Ensure card is above backdrop
        onClick={cardClickHandler} // Add click handler to the card
      >
        <div class="card-body p-6">
          {/* Display artist in bold, without a label */}
          <p style={{ "font-weight": "bold" }}>{song()?.artist}</p>
          {/* Display title directly, without a label */}
          <p class="text-sm opacity-80">{song()?.title}</p>

          {/* Genres / Styles Section */}
          <div class="mt-3">
            <div class="text-xs font-semibold uppercase tracking-wider text-base-content/70 mb-1.5">
              Styles
            </div>

            {/* List of assigned styles */}
            <div class="flex flex-wrap gap-1.5 items-center min-h-[28px]">
              <For each={songStyles()}>
                {(style) => (
                  <span class="badge badge-secondary gap-1 py-3 px-2.5 text-xs">
                    <span>{style.name}</span>
                    <Show when={isRemoveMode()}>
                      <button
                        type="button"
                        class="btn btn-ghost btn-xs btn-circle h-4 w-4 min-h-0 text-error-content hover:bg-error hover:text-white ml-0.5"
                        onClick={() => handleRemoveStyle(style.id)}
                        title={`Remove ${style.name}`}
                        aria-label={`Remove ${style.name}`}
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </Show>
                  </span>
                )}
              </For>
              <Show when={!loadingStyles() && songStyles().length === 0}>
                <span class="text-xs text-base-content/60 italic">No styles assigned</span>
              </Show>
              <Show when={loadingStyles()}>
                <span class="loading loading-spinner loading-xs text-primary"></span>
              </Show>
            </div>

            {/* Action buttons row: Add Style & Remove Style */}
            <div class="flex flex-row gap-2 mt-3 items-center">
              <button
                type="button"
                class="btn btn-xs btn-outline btn-primary"
                onClick={() => {
                  const nextState = !showAddMenu();
                  setShowAddMenu(nextState);
                  if (nextState) {
                    setIsRemoveMode(false);
                    fetchGenreTree();
                  }
                }}
              >
                <Show when={showAddMenu()} fallback={"+ Add Style"}>
                  Cancel Add
                </Show>
              </button>

              <Show when={songStyles().length > 0}>
                <button
                  type="button"
                  class={`btn btn-xs ${isRemoveMode() ? "btn-error" : "btn-outline btn-error"}`}
                  onClick={() => {
                    const nextRemove = !isRemoveMode();
                    setIsRemoveMode(nextRemove);
                    if (nextRemove) {
                      setShowAddMenu(false);
                    }
                  }}
                >
                  {isRemoveMode() ? "Done" : "Remove Style"}
                </button>
              </Show>
            </div>

            {/* Hierarchical Tree for Adding Styles */}
            <Show when={showAddMenu()}>
              <div class="mt-2 p-2 bg-base-300 rounded-box flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Search styles..."
                  class="input input-xs input-bordered w-full"
                  value={searchText()}
                  onInput={(e) => setSearchText(e.currentTarget.value)}
                  autofocus
                />
                <div class="max-h-48 overflow-y-auto flex flex-col divide-y divide-base-200/40">
                  <Show when={!loadingTree()} fallback={<div class="p-2 text-center text-xs opacity-60">Loading styles tree...</div>}>
                    <For each={genreTree()}>
                      {(genreWrapper) => (
                        <StyleTreeItem
                          genre={genreWrapper}
                          padding={0}
                          assignedStyleIds={assignedStyleIds}
                          onAddStyle={handleAddStyle}
                          searchFilter={searchText()}
                        />
                      )}
                    </For>
                    <Show when={genreTree().length === 0}>
                      <span class="text-xs text-base-content/60 p-1">No styles available</span>
                    </Show>
                  </Show>
                </div>
              </div>
            </Show>
          </div>

          <div class="card-actions justify-end mt-4">
            <Rating song={song()} mutable={true} />
          </div>
        </div>
      </div>
    </Show>
  );
};

export default SongInfo;
