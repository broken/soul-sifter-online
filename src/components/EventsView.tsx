import { type Component, createSignal, onMount, createMemo, Show, For } from "solid-js";
import { JamBaseService, JamBaseEvent, JamBaseMetro, POPULAR_METROS, JamBaseEventPerformer, normalizeArtistName, extractArtistNames } from "../services/JamBaseService";
import { useSongs } from "./SongsContext";
import { supabase } from "./App";
import ArtistEventsModal from "./ArtistEventsModal";

export interface EventsViewProps {
  onBackToSettings: () => void;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (_) {
    return dateStr;
  }
};

const formatTime = (dateStr?: string) => {
  if (!dateStr || !dateStr.includes("T")) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch (_) {
    return "";
  }
};

const formatLocation = (event: JamBaseEvent) => {
  const loc = event.location;
  if (!loc) return "";
  const parts: string[] = [];
  if (loc.name) parts.push(loc.name);
  if (loc.address?.addressLocality) parts.push(loc.address.addressLocality);
  const region = typeof loc.address?.addressRegion === "object" 
    ? (loc.address.addressRegion?.alternateName || loc.address.addressRegion?.name)
    : loc.address?.addressRegion;
  if (region) parts.push(region);
  return parts.join(", ");
};

const EventsView: Component<EventsViewProps> = (props) => {
  const { songs } = useSongs();
  const [events, setEvents] = createSignal<JamBaseEvent[]>([]);
  const [loading, setLoading] = createSignal<boolean>(false);
  const [error, setError] = createSignal<string | null>(null);
  const [fromCache, setFromCache] = createSignal<boolean>(false);
  const [searchFilter, setSearchFilter] = createSignal<string>("");
  const [libraryOnly, setLibraryOnly] = createSignal<boolean>(true); // Default to library artists only
  const [selectedArtistForModal, setSelectedArtistForModal] = createSignal<string | null>(null);
  const [libraryArtists, setLibraryArtists] = createSignal<string[]>([]);
  const [activeMetro, setActiveMetro] = createSignal<JamBaseMetro>({
    identifier: JamBaseService.getSettings().metroId,
    name: JamBaseService.getSettings().metroName,
  });

  const settings = createMemo(() => JamBaseService.getSettings());

  // Normalized set of artist names present in library + loaded tracks
  const normalizedLibraryArtistSet = createMemo(() => {
    const set = new Set<string>();
    for (const a of libraryArtists()) {
      for (const extracted of extractArtistNames(a)) {
        const norm = normalizeArtistName(extracted);
        if (norm) set.add(norm);
      }
    }
    for (const s of songs || []) {
      if (s.artist) {
        for (const extracted of extractArtistNames(s.artist)) {
          const norm = normalizeArtistName(extracted);
          if (norm) set.add(norm);
        }
      }
      if ((s as any).remixer) {
        for (const extracted of extractArtistNames((s as any).remixer)) {
          const norm = normalizeArtistName(extracted);
          if (norm) set.add(norm);
        }
      }
    }
    return set;
  });

  const isLibraryArtist = (event: JamBaseEvent): boolean => {
    const set = normalizedLibraryArtistSet();
    if (set.size === 0) return false;

    // 1. Collect performer candidates
    const performerCandidates: string[] = [];
    if (event.performer && event.performer.length > 0) {
      for (const p of event.performer) {
        if (p.name) {
          for (const sub of extractArtistNames(p.name)) {
            const norm = normalizeArtistName(sub);
            if (norm) performerCandidates.push(norm);
          }
        }
      }
    }

    // 2. Exact match on any performer candidate
    for (const cand of performerCandidates) {
      if (set.has(cand)) return true;
    }

    // 3. Word boundary matching between performers and library artists
    for (const cand of performerCandidates) {
      if (cand.length >= 3) {
        for (const artist of set) {
          if (artist.length >= 3) {
            if (cand === artist) return true;
            if (cand.length > artist.length) {
              const regex = new RegExp(`(^|\\s)${artist.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`, "i");
              if (regex.test(cand)) return true;
            }
            if (artist.length > cand.length) {
              const regex = new RegExp(`(^|\\s)${cand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`, "i");
              if (regex.test(artist)) return true;
            }
          }
        }
      }
    }

    // 4. Whole-word match on event title (event.name)
    const normEvent = normalizeArtistName(event.name || "");
    if (normEvent) {
      for (const artist of set) {
        if (artist.length >= 4) {
          const regex = new RegExp(`(^|\\s)${artist.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`, "i");
          if (regex.test(normEvent)) {
            return true;
          }
        }
      }
    }

    return false;
  };

  const loadEvents = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      // Load library artists from Supabase / localStorage cache
      const artists = await JamBaseService.getLibraryArtists(supabase, forceRefresh);
      setLibraryArtists(artists);

      const res = await JamBaseService.getMetroUpcomingEvents({
        forceRefresh,
        metroId: activeMetro().identifier,
        daysLimit: settings().daysLimit,
      });

      setEvents(res.events);
      setFromCache(res.fromCache);
    } catch (e: any) {
      setError(e?.message || "Failed to load events for this metro area.");
    } finally {
      setLoading(false);
    }
  };

  onMount(() => {
    loadEvents(false);
  });

  const handleSwitchMetro = (metro: JamBaseMetro) => {
    setActiveMetro(metro);
    JamBaseService.saveSettings({ metroId: metro.identifier, metroName: metro.name });
    loadEvents(false);
  };

  const filteredEvents = createMemo(() => {
    let list = events();

    if (libraryOnly()) {
      list = list.filter((e) => isLibraryArtist(e));
    }

    const query = searchFilter().toLowerCase().trim();
    if (query) {
      list = list.filter((e) => {
        const title = (e.name || "").toLowerCase();
        const loc = formatLocation(e).toLowerCase();
        const performers = (e.performer || []).map((p) => (p.name || "").toLowerCase()).join(" ");
        return title.includes(query) || loc.includes(query) || performers.includes(query);
      });
    }

    return list;
  });

  const libraryMatchCount = createMemo(() => {
    return events().filter((e) => isLibraryArtist(e)).length;
  });

  return (
    <div
      class="overflow-x-hidden overflow-y-auto w-screen p-4 max-w-3xl mx-auto flex flex-col gap-4"
      style="height: calc(100vh - 128px);"
    >
      {/* Header */}
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="btn btn-ghost btn-sm btn-circle"
            onClick={props.onBackToSettings}
            title="Back to Settings"
            aria-label="Back to Settings"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 class="text-lg font-bold flex items-center gap-2">
              Upcoming Concerts
              <span class="badge badge-primary badge-sm text-[10px] uppercase font-bold tracking-wider">JamBase</span>
            </h1>
            <p class="text-xs text-base-content/60">
              {activeMetro().name} • Next {settings().daysLimit} days
            </p>
          </div>
        </div>

        <div class="flex items-center gap-1.5">
          <button
            type="button"
            class="btn btn-ghost btn-xs sm:btn-sm gap-1"
            onClick={() => loadEvents(true)}
            disabled={loading()}
            title="Refresh events (Bypass 24h cache)"
          >
            <svg
              class={`w-4 h-4 ${loading() ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span class="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Quick City Switcher & Filter Bar */}
      <div class="flex flex-wrap items-center justify-between gap-2 bg-base-200 p-3 rounded-box shadow-sm">
        {/* City Toggle Buttons */}
        <div class="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <For each={POPULAR_METROS.slice(0, 4)}>
            {(m) => (
              <button
                type="button"
                class={`btn btn-xs ${
                  activeMetro().identifier === m.identifier
                    ? "btn-primary font-bold"
                    : "btn-ghost bg-base-100 hover:bg-base-300"
                }`}
                onClick={() => handleSwitchMetro(m)}
              >
                {m.name.split(",")[0]}
              </button>
            )}
          </For>
        </div>

        {/* Library Only Toggle */}
        <div class="flex items-center gap-2 ml-auto">
          <button
            type="button"
            class={`btn btn-xs sm:btn-sm ${libraryOnly() ? "btn-secondary" : "btn-ghost bg-base-100"}`}
            onClick={() => setLibraryOnly(!libraryOnly())}
          >
            {libraryOnly() ? `✓ My Artists Only (${libraryMatchCount()})` : "Show All Concerts"}
          </button>
          <Show when={fromCache()}>
            <span class="text-[10px] text-base-content/50 italic shrink-0">Cached</span>
          </Show>
        </div>
      </div>

      {/* Search Input */}
      <div>
        <input
          type="text"
          placeholder="Search shows, artists, or venues..."
          class="input input-sm input-bordered w-full"
          value={searchFilter()}
          onInput={(e) => setSearchFilter(e.currentTarget.value)}
        />
      </div>

      {/* Error View */}
      <Show when={error()}>
        <div class="alert alert-error text-xs p-3">
          <span>{error()}</span>
          <button
            type="button"
            class="btn btn-xs btn-outline ml-auto"
            onClick={props.onBackToSettings}
          >
            Check Settings
          </button>
        </div>
      </Show>

      {/* Loading View */}
      <Show when={loading()}>
        <div class="py-12 flex flex-col items-center justify-center gap-3">
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <span class="text-sm text-base-content/60">Fetching concerts in {activeMetro().name}...</span>
        </div>
      </Show>

      {/* Empty State */}
      <Show when={!loading() && !error() && filteredEvents().length === 0}>
        <div class="card bg-base-200 shadow-sm text-center py-10 px-4">
          <svg class="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 class="text-base font-semibold">No concerts found</h3>
          <p class="text-xs text-base-content/60 max-w-sm mx-auto mt-1">
            {libraryOnly()
              ? `None of your library artists currently have listed shows in ${activeMetro().name} in the next ${settings().daysLimit} days.`
              : `No upcoming concerts listed in ${activeMetro().name} for this timeframe.`}
          </p>
          <div class="mt-4 flex justify-center gap-2">
            <Show when={libraryOnly() && events().length > 0}>
              <button
                type="button"
                class="btn btn-sm btn-outline btn-primary"
                onClick={() => setLibraryOnly(false)}
              >
                View All {events().length} Concerts in Metro
              </button>
            </Show>
            <button
              type="button"
              class="btn btn-sm btn-primary"
              onClick={props.onBackToSettings}
            >
              Adjust Settings
            </button>
          </div>
        </div>
      </Show>

      {/* Events Feed */}
      <Show when={!loading() && filteredEvents().length > 0}>
        <div class="flex flex-col gap-3">
          <For each={filteredEvents()}>
            {(event) => {
              const ticketUrl = event.offers?.[0]?.url || event.url;
              const price = event.offers?.[0]?.priceSpecification?.price;
              const currency = event.offers?.[0]?.priceSpecification?.priceCurrency || "$";
              const isMatch = isLibraryArtist(event);

              return (
                <div
                  class={`card bg-base-200 shadow-sm border transition-all ${
                    isMatch ? "border-secondary/60 bg-secondary/5" : "border-base-300 hover:border-base-content/20"
                  }`}
                >
                  <div class="card-body p-4 sm:p-5">
                    <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div class="flex-1 min-w-0">
                        {/* Date & Badges */}
                        <div class="flex items-center gap-2 text-xs font-semibold text-primary mb-1">
                          <span>{formatDate(event.startDate)}</span>
                          <Show when={formatTime(event.startDate)}>
                            <span class="text-base-content/60 font-normal">• {formatTime(event.startDate)}</span>
                          </Show>
                          <Show when={isMatch}>
                            <span class="badge badge-secondary badge-xs py-2 px-2 text-[10px] font-bold">
                              In Your Library
                            </span>
                          </Show>
                        </div>

                        {/* Title */}
                        <h2 class="text-base font-bold text-base-content truncate" title={event.name}>
                          {event.name}
                        </h2>

                        {/* Location */}
                        <p class="text-xs text-base-content/70 mt-1 flex items-center gap-1">
                          <svg class="w-3.5 h-3.5 shrink-0 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span class="truncate">{formatLocation(event)}</span>
                        </p>

                        {/* Performers */}
                        <Show when={event.performer && event.performer.length > 0}>
                          <div class="flex flex-wrap gap-1.5 mt-2">
                            <For each={event.performer}>
                              {(p) => {
                                const artistInLib = p.name && normalizedLibraryArtistSet().has(normalizeArtistName(p.name));
                                return (
                                  <button
                                    type="button"
                                    onClick={() => p.name && setSelectedArtistForModal(p.name)}
                                    class={`badge badge-sm py-2 px-2.5 text-[11px] gap-1 cursor-pointer hover:opacity-80 transition-opacity ${
                                      artistInLib ? "badge-secondary font-bold" : "badge-ghost"
                                    }`}
                                    title={`View all tour dates & details for ${p.name}`}
                                  >
                                    <span>{p.name}</span>
                                    <svg class="w-2.5 h-2.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                  </button>
                                );
                              }}
                            </For>
                          </div>
                        </Show>
                      </div>

                      {/* Right Action / Tickets */}
                      <div class="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-base-300">
                        <Show when={price}>
                          <span class="text-xs font-semibold text-base-content/80">
                            {currency === "USD" ? "$" : currency}{price}
                          </span>
                        </Show>

                        <Show when={ticketUrl}>
                          <a
                            href={ticketUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="btn btn-sm btn-primary shrink-0 gap-1"
                          >
                            Tickets
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </Show>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </Show>

      {/* Artist Events Modal for clicked performer tags */}
      <Show when={!!selectedArtistForModal()}>
        <ArtistEventsModal
          artistName={selectedArtistForModal()}
          onClose={() => setSelectedArtistForModal(null)}
        />
      </Show>
    </div>
  );
};

export default EventsView;
