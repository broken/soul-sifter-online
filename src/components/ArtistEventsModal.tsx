import { type Component, createSignal, createEffect, createMemo, Show, For } from "solid-js";
import { JamBaseService, JamBaseEvent, JamBaseArtist, CachedArtistMapping } from "../services/JamBaseService";
import Backdrop from "./Backdrop";

export interface ArtistEventsModalProps {
  artistName: string | null;
  onClose: () => void;
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

const ArtistEventsModal: Component<ArtistEventsModalProps> = (props) => {
  const [events, setEvents] = createSignal<JamBaseEvent[]>([]);
  const [loading, setLoading] = createSignal<boolean>(false);
  const [error, setError] = createSignal<string | null>(null);
  const [fromCache, setFromCache] = createSignal<boolean>(false);
  const [mapping, setMapping] = createSignal<CachedArtistMapping | undefined>(undefined);
  const [filterNearMe, setFilterNearMe] = createSignal<boolean>(false);

  // Fix Match sub-state
  const [isFixingMatch, setIsFixingMatch] = createSignal<boolean>(false);
  const [searchQuery, setSearchQuery] = createSignal<string>("");
  const [manualIdInput, setManualIdInput] = createSignal<string>("");
  const [searchResults, setSearchResults] = createSignal<JamBaseArtist[]>([]);
  const [searchingArtists, setSearchingArtists] = createSignal<boolean>(false);

  const loadEvents = async (forceRefresh = false) => {
    const name = props.artistName?.trim();
    if (!name) return;

    setLoading(true);
    setError(null);
    setMapping(JamBaseService.getArtistMapping(name));

    try {
      // Fetch and cache all upcoming dates for this artist
      const res = await JamBaseService.getArtistEvents(name, {
        forceRefresh,
      });

      setEvents(res.events);
      setFromCache(res.fromCache);
      setMapping(JamBaseService.getArtistMapping(name));
    } catch (e: any) {
      setError(e?.message || "Failed to load events from JamBase.");
    } finally {
      setLoading(false);
    }
  };

  createEffect(() => {
    if (props.artistName) {
      setIsFixingMatch(false);
      setFilterNearMe(false);
      setSearchQuery(props.artistName);
      setManualIdInput("");
      setSearchResults([]);
      loadEvents(false);
    }
  });

  const filteredEvents = createMemo(() => {
    const list = events();
    if (!filterNearMe()) {
      return list;
    }

    const settings = JamBaseService.getSettings();
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + settings.daysLimit);
    const todayStr = today.toISOString().split("T")[0];
    const futureStr = future.toISOString().split("T")[0];

    return list.filter((e) => {
      // Date filter
      if (e.startDate) {
        const d = e.startDate.split("T")[0];
        if (d < todayStr || d > futureStr) return false;
      }

      return JamBaseService.isEventNearMetro(e, settings.metroId, settings.metroName);
    });
  });

  const handleSearchArtists = async () => {
    const q = searchQuery().trim();
    if (!q) return;
    setSearchingArtists(true);
    try {
      const results = await JamBaseService.searchArtists(q);
      setSearchResults(results);
    } catch (e: any) {
      setError(e?.message || "Failed to search JamBase artists.");
    } finally {
      setSearchingArtists(false);
    }
  };

  const handleSelectArtistMatch = (artist: JamBaseArtist) => {
    if (!props.artistName) return;
    JamBaseService.saveArtistMapping(props.artistName, artist.identifier, artist.name, true);
    JamBaseService.clearArtistEventCache(props.artistName);
    setIsFixingMatch(false);
    loadEvents(true);
  };

  const handleApplyManualId = () => {
    const rawId = manualIdInput().trim();
    if (!props.artistName || !rawId) return;

    let id = rawId;
    // Extract ID if a full URL was pasted
    if (rawId.includes("jambase.com/band/")) {
      const parts = rawId.split("jambase.com/band/");
      id = parts[1].split("/")[0].split("?")[0];
    }
    if (!id.startsWith("jambase:") && !id.includes("/")) {
      id = `jambase:${id}`;
    }

    JamBaseService.saveArtistMapping(props.artistName, id, props.artistName, true);
    JamBaseService.clearArtistEventCache(props.artistName);
    setIsFixingMatch(false);
    loadEvents(true);
  };

  const handleResetMapping = () => {
    if (!props.artistName) return;
    JamBaseService.removeArtistMapping(props.artistName);
    JamBaseService.clearArtistEventCache(props.artistName);
    setIsFixingMatch(false);
    loadEvents(true);
  };

  return (
    <Show when={!!props.artistName}>
      <Backdrop show={!!props.artistName} onClick={props.onClose} />
      <div class="fixed inset-0 z-[120] overflow-hidden pointer-events-none flex items-start justify-center pt-14 md:pt-20 px-3">
        <div class="card w-full max-w-lg bg-base-200 shadow-2xl max-h-[85vh] overflow-y-auto pointer-events-auto border border-base-300">
          <div class="card-body p-5">
            {/* Header */}
            <div class="flex items-start justify-between gap-2 pb-2 border-b border-base-300">
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="card-title text-lg font-bold truncate">{props.artistName}</h2>
                  <span class="badge badge-primary badge-outline text-[10px] tracking-wide font-semibold uppercase">
                    JamBase
                  </span>
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <Show when={mapping()}>
                    <span class="text-xs text-base-content/60 font-mono flex items-center gap-1">
                      ID: {mapping()?.id}
                      <Show when={mapping()?.isManual}>
                        <span class="badge badge-xs badge-ghost text-[9px]">Manual Match</span>
                      </Show>
                    </span>
                  </Show>
                  <button
                    type="button"
                    class="btn btn-link btn-xs p-0 h-auto text-primary text-xs"
                    onClick={() => setIsFixingMatch(!isFixingMatch())}
                  >
                    {isFixingMatch() ? "Cancel Fix" : "Fix Match"}
                  </button>
                </div>
              </div>

              <div class="flex items-center gap-1">
                <button
                  type="button"
                  class="btn btn-ghost btn-xs btn-circle"
                  onClick={() => loadEvents(true)}
                  disabled={loading()}
                  title="Force refresh (Bypass 24h cache)"
                  aria-label="Refresh events"
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
                </button>
                <button
                  type="button"
                  class="btn btn-ghost btn-xs btn-circle text-base-content/60 hover:text-base-content"
                  onClick={props.onClose}
                  aria-label="Close modal"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Fix Match Panel */}
            <Show when={isFixingMatch()}>
              <div class="bg-base-300 p-3 rounded-lg flex flex-col gap-3 my-2 text-xs border border-primary/20">
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-primary">Correct JamBase Artist Match</span>
                  <button
                    type="button"
                    onClick={handleResetMapping}
                    class="text-error hover:underline text-[11px]"
                  >
                    Reset to auto-match
                  </button>
                </div>

                {/* Search */}
                <div class="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search artist name on JamBase..."
                    class="input input-xs input-bordered flex-1"
                    value={searchQuery()}
                    onInput={(e) => setSearchQuery(e.currentTarget.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchArtists()}
                  />
                  <button
                    type="button"
                    class="btn btn-xs btn-primary"
                    onClick={handleSearchArtists}
                    disabled={searchingArtists()}
                  >
                    {searchingArtists() ? "Searching..." : "Search"}
                  </button>
                </div>

                {/* Search Results */}
                <Show when={searchResults().length > 0}>
                  <div class="max-h-36 overflow-y-auto flex flex-col gap-1 pr-1 bg-base-100 p-2 rounded">
                    <For each={searchResults()}>
                      {(result) => (
                        <div class="flex items-center justify-between p-1.5 hover:bg-base-200 rounded">
                          <div class="truncate mr-2">
                            <span class="font-medium text-xs block truncate">{result.name}</span>
                            <span class="text-[10px] text-base-content/50 font-mono">{result.identifier}</span>
                          </div>
                          <button
                            type="button"
                            class="btn btn-xs btn-outline btn-primary"
                            onClick={() => handleSelectArtistMatch(result)}
                          >
                            Select
                          </button>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>

                {/* Direct ID input */}
                <div class="pt-2 border-t border-base-content/10">
                  <label class="block text-[11px] text-base-content/70 mb-1">
                    Or directly input JamBase Artist ID / URL:
                  </label>
                  <div class="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. jambase:7600 or 7600"
                      class="input input-xs input-bordered flex-1"
                      value={manualIdInput()}
                      onInput={(e) => setManualIdInput(e.currentTarget.value)}
                    />
                    <button
                      type="button"
                      class="btn btn-xs btn-secondary"
                      onClick={handleApplyManualId}
                      disabled={!manualIdInput().trim()}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </Show>

            {/* Filter Toggle & Cache Notice */}
            <div class="flex items-center justify-between text-xs my-1">
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  class={`btn btn-xs ${!filterNearMe() ? "btn-primary" : "btn-ghost bg-base-100"}`}
                  onClick={() => setFilterNearMe(false)}
                >
                  All Tour Dates ({events().length})
                </button>
                <button
                  type="button"
                  class={`btn btn-xs ${filterNearMe() ? "btn-primary" : "btn-ghost bg-base-100"}`}
                  onClick={() => setFilterNearMe(true)}
                >
                  Near Me ({JamBaseService.getSettings().metroName.split(",")[0]})
                </button>
              </div>

              <Show when={fromCache()}>
                <span class="text-[10px] text-base-content/50 italic">Cached (24h)</span>
              </Show>
            </div>

            {/* Error Message */}
            <Show when={error()}>
              <div class="alert alert-error text-xs py-2 px-3 my-2">
                <span>{error()}</span>
              </div>
            </Show>

            {/* Loading */}
            <Show when={loading()}>
              <div class="py-8 flex flex-col items-center justify-center gap-2">
                <span class="loading loading-spinner loading-md text-primary"></span>
                <span class="text-xs text-base-content/60">Fetching upcoming events...</span>
              </div>
            </Show>

            {/* Empty State */}
            <Show when={!loading() && !error() && filteredEvents().length === 0}>
              <div class="text-center py-8 text-base-content/60">
                <svg class="w-10 h-10 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p class="text-sm font-medium">No upcoming events found</p>
                <p class="text-xs mt-1">
                  {filterNearMe()
                    ? `No upcoming shows found near ${JamBaseService.getSettings().metroName} in the next ${JamBaseService.getSettings().daysLimit} days.`
                    : "No tour dates currently listed on JamBase for this artist."}
                </p>
                <Show when={filterNearMe() && events().length > 0}>
                  <button
                    type="button"
                    class="btn btn-xs btn-outline btn-primary mt-2"
                    onClick={() => setFilterNearMe(false)}
                  >
                    View All {events().length} Tour Dates
                  </button>
                </Show>
              </div>
            </Show>

            {/* Events List */}
            <Show when={!loading() && filteredEvents().length > 0}>
              <div class="flex flex-col gap-2.5 mt-2">
                <For each={filteredEvents()}>
                  {(event) => {
                    const ticketUrl = event.offers?.[0]?.url || event.url;
                    const price = event.offers?.[0]?.priceSpecification?.price;
                    const currency = event.offers?.[0]?.priceSpecification?.priceCurrency || "$";

                    return (
                      <div class="bg-base-100 p-3 rounded-lg border border-base-300 hover:border-primary/40 transition-colors shadow-sm">
                        <div class="flex items-start justify-between gap-2">
                          <div class="flex-1 min-w-0">
                            <div class="text-xs font-bold text-primary flex items-center gap-1.5">
                              <span>{formatDate(event.startDate)}</span>
                              <Show when={formatTime(event.startDate)}>
                                <span class="text-base-content/60 font-normal">
                                  • {formatTime(event.startDate)}
                                </span>
                              </Show>
                            </div>
                            <h3 class="text-sm font-semibold truncate mt-0.5" title={event.name}>
                              {event.name}
                            </h3>
                            <p class="text-xs text-base-content/70 mt-0.5 truncate">
                              {formatLocation(event)}
                            </p>
                          </div>

                          <Show when={ticketUrl}>
                            <a
                              href={ticketUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              class="btn btn-xs btn-primary shrink-0 self-center"
                            >
                              Tickets
                              <svg class="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </Show>
                        </div>

                        <Show when={price}>
                          <div class="mt-2 pt-1.5 border-t border-base-200 text-[11px] text-base-content/60 flex justify-between">
                            <span>Tickets from:</span>
                            <span class="font-medium text-base-content/80">
                              {currency === "USD" ? "$" : currency}
                              {price}
                            </span>
                          </div>
                        </Show>
                      </div>
                    );
                  }}
                </For>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default ArtistEventsModal;
