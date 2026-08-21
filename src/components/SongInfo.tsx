import { Show, For, type Component, createSignal, createEffect, onMount, onCleanup, createMemo } from "solid-js";

import Rating from "./Rating";
import SongPlayer from "./SongPlayer";
import { SongConsumer } from "./SongContext";
import { useSongs } from "./SongsContext";
import Backdrop from './Backdrop';
import { supabase } from "./App";
import { Album, Song, Style, StyleChildren } from "../model.types";
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
              <Show when={props.genre.collapsed} fallback={
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              }>
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
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
  const songsContext = useSongs?.();

  const [genreTree, setGenreTree] = createSignal<GenreWrapper[]>([]);
  const [songStyles, setSongStyles] = createSignal<Style[]>([]);
  const [album, setAlbum] = createSignal<Album | null | undefined>(undefined);
  const [loadingStyles, setLoadingStyles] = createSignal<boolean>(false);
  const [loadingTree, setLoadingTree] = createSignal<boolean>(false);
  const [isEditMode, setIsEditMode] = createSignal<boolean>(false);
  const [searchText, setSearchText] = createSignal<string>("");

  // Swipe and transition signals
  const [dragX, setDragX] = createSignal<number>(0);
  const [isDragging, setIsDragging] = createSignal<boolean>(false);
  const [animState, setAnimState] = createSignal<string>("");
  const [isTransitioning, setIsTransitioning] = createSignal<boolean>(false);

  const songList = () => songsContext?.songs ?? [];

  const currentIndex = createMemo(() => {
    const current = song();
    const list = songList();
    if (!current || !list.length) return -1;
    return list.findIndex((s) => s.id === current.id);
  });

  const prevSong = createMemo(() => {
    const idx = currentIndex();
    if (idx > 0) return songList()[idx - 1];
    return undefined;
  });

  const nextSong = createMemo(() => {
    const idx = currentIndex();
    const list = songList();
    if (idx !== -1 && idx < list.length - 1) return list[idx + 1];
    return undefined;
  });

  const releaseDate = createMemo(() => {
    const alb = album();
    if (!alb) return null;
    const year = alb.releasedateyear;
    const month = alb.releasedatemonth;
    const day = alb.releasedateday;

    if (year && month && day) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    if (year && month) {
      return `${year}-${String(month).padStart(2, '0')}`;
    }
    if (year) {
      return `${year}`;
    }
    return null;
  });

  const navigateToSong = (targetSong: Song, direction: 'next' | 'prev') => {
    if (isTransitioning()) return;
    setIsTransitioning(true);
    setIsDragging(false);

    if (direction === 'next') {
      setAnimState('slide-out-left');
      setTimeout(() => {
        setSong(targetSong);
        setDragX(0);
        setIsTransitioning(false);
        setAnimState('slide-in-prepare-right');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setAnimState('slide-in-active');
            setTimeout(() => {
              setAnimState('');
            }, 200);
          });
        });
      }, 160);
    } else {
      setAnimState('slide-out-right');
      setTimeout(() => {
        setSong(targetSong);
        setDragX(0);
        setIsTransitioning(false);
        setAnimState('slide-in-prepare-left');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setAnimState('slide-in-active');
            setTimeout(() => {
              setAnimState('');
            }, 200);
          });
        });
      }, 160);
    }
  };

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
        genreList = stylesData.slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      }

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
      setGenreTree([...parentGenres]);
    } catch (err) {
      console.error('Failed to load genre tree:', err);
    } finally {
      setLoadingTree(false);
    }
  };

  onMount(() => {
    fetchGenreTree();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!song()) return;
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.key === 'ArrowRight' && nextSong()) {
        e.preventDefault();
        navigateToSong(nextSong()!, 'next');
      } else if (e.key === 'ArrowLeft' && prevSong()) {
        e.preventDefault();
        navigateToSong(prevSong()!, 'prev');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    onCleanup(() => {
      window.removeEventListener('keydown', handleKeyDown);
    });
  });

  let lastSongId: number | undefined = undefined;

  createEffect(async () => {
    const currentSong = song();
    const currentSongId = currentSong?.id;

    if (currentSongId === lastSongId) {
      return;
    }
    lastSongId = currentSongId;

    setIsEditMode(false);
    setSearchText("");

    if (!currentSong) {
      setSongStyles([]);
      setAlbum(undefined);
      return;
    }

    if (currentSong.albums) {
      setAlbum(currentSong.albums);
    } else if (currentSong.albumid) {
      const fetchAlbum = async (albumId: number) => {
        try {
          const { data, error } = await supabase
            .from('albums')
            .select('*')
            .eq('id', albumId)
            .maybeSingle();

          if (error) {
            console.error('Error fetching album:', error);
            setAlbum(null);
          } else {
            setAlbum(data);
          }
        } catch (err) {
          console.error('Failed to fetch album:', err);
          setAlbum(null);
        }
      };
      fetchAlbum(currentSong.albumid);
    } else {
      setAlbum(null);
    }

    const fetchSongStyles = async (songId: number) => {
      setLoadingStyles(true);
      try {
        const { data: songStylesData, error } = await supabase
          .from('songstyles')
          .select('styleid, styles(*)')
          .eq('songid', songId);

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
    };

    fetchSongStyles(currentSong.id);
  });

  const assignedStyleIds = createMemo(() => new Set(songStyles().map((s) => s.id)));

  const handleAddStyle = async (style: Style) => {
    const currentSong = song();
    if (!currentSong) return;

    // Optimistic update
    setSongStyles((prev) => [...prev, style].sort((a, b) => (a.name || '').localeCompare(b.name || '')));

    try {
      const { error: insertError } = await supabase.from('songstyles').insert({
        songid: currentSong.id,
        styleid: style.id,
      });

      if (insertError) {
        console.error('Error adding song style:', insertError);
        // Revert on error
        setSongStyles((prev) => prev.filter((s) => s.id !== style.id));
        return;
      }

      const { error: changeError } = await supabase.from('changes').insert({
        key: currentSong.id,
        table: 'SongStyles',
        field: 'insert',
        value: String(style.id),
      });

      if (changeError) {
        console.error('Error recording change for added song style:', changeError);
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
      const { error: deleteError } = await supabase
        .from('songstyles')
        .delete()
        .eq('songid', currentSong.id)
        .eq('styleid', styleId);

      if (deleteError) {
        console.error('Error removing song style:', deleteError);
        // Revert on error
        if (removed) {
          setSongStyles((prev) => [...prev, removed].sort((a, b) => (a.name || '').localeCompare(b.name || '')));
        }
        return;
      }

      const { error: changeError } = await supabase.from('changes').insert({
        key: currentSong.id,
        table: 'SongStyles',
        field: 'delete',
        value: String(styleId),
      });

      if (changeError) {
        console.error('Error recording change for removed song style:', changeError);
      }
    } catch (err) {
      console.error('Failed to remove song style:', err);
      if (removed) {
        setSongStyles((prev) => [...prev, removed].sort((a, b) => (a.name || '').localeCompare(b.name || '')));
      }
    }
  };

  const handleClose = () => {
    setIsEditMode(false);
    setDragX(0);
    setIsDragging(false);
    setAnimState('');
    setAlbum(undefined);
    setSong(undefined);
  };

  const cardClickHandler = (event: MouseEvent) => {
    event.stopPropagation(); // Prevent clicks inside the card from closing it
  };

  // Touch and pointer gesture handling
  let gestureStartX = 0;
  let gestureStartY = 0;
  let gestureStartTime = 0;
  let gestureDirection: 'horizontal' | 'vertical' | null = null;
  let isPointerActive = false;

  const onTouchStart = (e: TouchEvent) => {
    if (isTransitioning()) return;
    const target = e.target as HTMLElement | null;
    if (target && target.closest('input, textarea, select, button, a, [role="slider"], .range')) {
      return;
    }
    const touch = e.touches[0];
    gestureStartX = touch.clientX;
    gestureStartY = touch.clientY;
    gestureStartTime = Date.now();
    gestureDirection = null;
    isPointerActive = true;
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!isPointerActive || isTransitioning()) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - gestureStartX;
    const deltaY = touch.clientY - gestureStartY;

    if (gestureDirection === null) {
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          gestureDirection = 'horizontal';
          setIsDragging(true);
        } else {
          gestureDirection = 'vertical';
        }
      }
    }

    if (gestureDirection === 'horizontal') {
      let effectiveDeltaX = deltaX;
      if ((deltaX > 0 && !prevSong()) || (deltaX < 0 && !nextSong())) {
        effectiveDeltaX = deltaX * 0.25; // Rubber banding resistance at ends
      }
      setDragX(effectiveDeltaX);
    }
  };

  const onTouchEnd = () => {
    if (!isPointerActive) return;
    isPointerActive = false;

    if (gestureDirection === 'horizontal' && isDragging()) {
      const elapsed = Date.now() - gestureStartTime;
      const currentDrag = dragX();
      const velocity = Math.abs(currentDrag) / (elapsed || 1);
      const isFlick = velocity > 0.35 && Math.abs(currentDrag) > 25;
      const isPastThreshold = Math.abs(currentDrag) > 65;

      if ((isFlick || isPastThreshold) && currentDrag < 0 && nextSong()) {
        navigateToSong(nextSong()!, 'next');
      } else if ((isFlick || isPastThreshold) && currentDrag > 0 && prevSong()) {
        navigateToSong(prevSong()!, 'prev');
      } else {
        setIsDragging(false);
        setDragX(0);
      }
    } else {
      setIsDragging(false);
      setDragX(0);
    }
    gestureDirection = null;
  };

  // Card transform styling based on drag and transition state
  const cardTransformStyle = () => {
    if (isDragging()) {
      return {
        transform: `translateX(${dragX()}px)`,
        transition: 'none',
        'user-select': 'none',
      };
    }
    if (animState() === 'slide-out-left') {
      return {
        transform: 'translateX(-110vw)',
        opacity: '0',
        transition: 'transform 160ms cubic-bezier(0.4, 0, 1, 1), opacity 160ms ease-in',
      };
    }
    if (animState() === 'slide-out-right') {
      return {
        transform: 'translateX(110vw)',
        opacity: '0',
        transition: 'transform 160ms cubic-bezier(0.4, 0, 1, 1), opacity 160ms ease-in',
      };
    }
    if (animState() === 'slide-in-prepare-right') {
      return {
        transform: 'translateX(100vw)',
        opacity: '0',
        transition: 'none',
      };
    }
    if (animState() === 'slide-in-prepare-left') {
      return {
        transform: 'translateX(-100vw)',
        opacity: '0',
        transition: 'none',
      };
    }
    if (animState() === 'slide-in-active') {
      return {
        transform: 'translateX(0px)',
        opacity: '1',
        transition: 'transform 200ms cubic-bezier(0, 0, 0.2, 1), opacity 200ms ease-out',
      };
    }
    return {
      transform: 'translateX(0px)',
      opacity: '1',
      transition: 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1), opacity 200ms ease',
    };
  };

  return (
    <Show when={!!song()}>
      <Backdrop show={!!song()} onClick={handleClose} />
      <div class="fixed inset-0 z-[100] overflow-hidden pointer-events-none flex items-start justify-center pt-16 md:pt-[25vh]">
        <div
          class="card w-96 max-w-[calc(100vw-2rem)] bg-base-200 shadow-xl max-h-[85vh] overflow-y-auto pointer-events-auto"
          style={{
            'touch-action': 'pan-y',
            ...cardTransformStyle(),
          }}
          onClick={cardClickHandler}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
        >
          <div class="card-body p-6">
          {/* Header Bar with Navigation Controls & Close Button */}
          <div class="flex items-center justify-between text-xs text-base-content/60 -mt-2 mb-2">
            <div class="flex items-center gap-1">
              <button
                type="button"
                class="btn btn-ghost btn-xs btn-circle"
                onClick={() => prevSong() && navigateToSong(prevSong()!, 'prev')}
                disabled={!prevSong()}
                title="Previous song (Swipe right or Left Arrow)"
                aria-label="Previous song"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <Show when={currentIndex() !== -1 && songList().length > 0}>
                <span class="font-mono text-[11px] opacity-75">
                  {currentIndex() + 1} / {songList().length}
                </span>
              </Show>
              <button
                type="button"
                class="btn btn-ghost btn-xs btn-circle"
                onClick={() => nextSong() && navigateToSong(nextSong()!, 'next')}
                disabled={!nextSong()}
                title="Next song (Swipe left or Right Arrow)"
                aria-label="Next song"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <button
              type="button"
              class="btn btn-ghost btn-xs btn-circle text-base-content/60 hover:text-base-content"
              onClick={handleClose}
              aria-label="Close modal"
              title="Close"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Display artist in bold, without a label */}
          <p style={{ "font-weight": "bold" }}>{song()?.artist}</p>
          {/* Display title directly, without a label */}
          <p class="text-sm opacity-80">{song()?.title}</p>
          {/* Display album name and release date */}
          <Show when={album()?.name || releaseDate()}>
            <p class="text-xs opacity-70 mt-0.5 text-right">
              <Show when={album()?.name}>
                <span>{album()?.name}</span>
              </Show>
              <Show when={album()?.name && releaseDate()}>
                <span class="mx-1.5">•</span>
              </Show>
              <Show when={releaseDate()}>
                <span>{releaseDate()}</span>
              </Show>
            </p>
          </Show>

          {/* YouTube Music Playback Controls */}
          <SongPlayer
            song={song()}
            onAutoPlayNext={() => nextSong() && navigateToSong(nextSong()!, 'next')}
          />

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
                    <Show when={isEditMode()}>
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

            {/* Hierarchical Tree for Adding Styles */}
            <Show when={isEditMode()}>
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

          <div class="card-actions justify-between items-center mt-4">
            <button
              type="button"
              aria-label={isEditMode() ? "Done" : "Edit"}
              class={`btn btn-xs ${isEditMode() ? "btn-error" : "btn-outline btn-error"}`}
              onClick={() => {
                const nextEdit = !isEditMode();
                setIsEditMode(nextEdit);
                if (nextEdit) {
                  fetchGenreTree();
                }
              }}
            >
              {isEditMode() ? "Done" : "Edit"}
            </button>
            <Rating song={song()} mutable={isEditMode()} size="2em" />
          </div>
        </div>
      </div>
    </div>
    </Show>
  );
};

export default SongInfo;
