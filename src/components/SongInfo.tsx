import { Show, For, type Component, createSignal, createEffect, onMount, createMemo } from "solid-js";

import Rating from "./Rating";
import { SongConsumer } from "./SongContext";
import Backdrop from './Backdrop';
import { supabase } from "./App";
import { Style } from "../model.types";

const SongInfo: Component = () => {
  const { song, setSong } = SongConsumer();

  const [allStyles, setAllStyles] = createSignal<Style[]>([]);
  const [songStyles, setSongStyles] = createSignal<Style[]>([]);
  const [loadingStyles, setLoadingStyles] = createSignal<boolean>(false);
  const [showAddMenu, setShowAddMenu] = createSignal<boolean>(false);
  const [isRemoveMode, setIsRemoveMode] = createSignal<boolean>(false);
  const [searchText, setSearchText] = createSignal<string>("");

  const fetchAllStyles = async () => {
    if (allStyles().length > 0) return;
    try {
      const { data, error } = await supabase.from('styles').select('*').order('name');
      if (error) {
        console.error('Error fetching all styles:', error);
      } else if (data) {
        setAllStyles(data);
      }
    } catch (err) {
      console.error('Failed to fetch all styles:', err);
    }
  };

  onMount(() => {
    fetchAllStyles();
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

  const availableStyles = createMemo(() => {
    const currentIds = new Set(songStyles().map((s) => s.id));
    const query = searchText().toLowerCase().trim();
    return allStyles()
      .filter((s) => !currentIds.has(s.id))
      .filter((s) => !query || (s.name || '').toLowerCase().includes(query));
  });

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
                    fetchAllStyles();
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

            {/* Searchable Add Style Panel */}
            <Show when={showAddMenu()}>
              <div class="mt-2 p-2 bg-base-300 rounded-box flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Search styles to add..."
                  class="input input-xs input-bordered w-full"
                  value={searchText()}
                  onInput={(e) => setSearchText(e.currentTarget.value)}
                  autofocus
                />
                <div class="max-h-36 overflow-y-auto flex flex-col gap-1">
                  <For each={availableStyles()}>
                    {(style) => (
                      <button
                        type="button"
                        class="btn btn-ghost btn-xs justify-start normal-case text-left hover:bg-primary hover:text-primary-content"
                        onClick={() => handleAddStyle(style)}
                      >
                        + {style.name}
                      </button>
                    )}
                  </For>
                  <Show when={availableStyles().length === 0}>
                    <span class="text-xs text-base-content/60 p-1">No matching styles found</span>
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
