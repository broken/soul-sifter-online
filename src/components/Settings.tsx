import { type Component, For, createSignal, Show, onMount } from "solid-js";

import { useTheme, darkThemes, lightThemes } from "./ThemeContext";
import { useFontSize, fontSizes } from "./FontSizeContext";
import { useAutoPlay } from "./AutoPlayContext";
import { JamBaseService, JamBaseSettings, JamBaseMetro, POPULAR_METROS } from "../services/JamBaseService";

export interface SettingsProps {
  onOpenEvents?: () => void;
}

const DAYS_OPTIONS = [14, 30, 60, 90];

const Settings: Component<SettingsProps> = (props) => {
  const { appTheme, setAppTheme } = useTheme();
  const { fontSize, setFontSize } = useFontSize();
  const { autoPlayNext, setAutoPlayNext, autoPlayOnOpen, setAutoPlayOnOpen } = useAutoPlay();

  const [jamBaseSettings, setJamBaseSettings] = createSignal<JamBaseSettings>(
    JamBaseService.getSettings()
  );
  const [metrosList, setMetrosList] = createSignal<JamBaseMetro[]>(POPULAR_METROS);
  const [searchCityQuery, setSearchCityQuery] = createSignal<string>("");
  const [citySearchResults, setCitySearchResults] = createSignal<JamBaseMetro[]>([]);
  const [isSearchingCity, setIsSearchingCity] = createSignal<boolean>(false);
  const [cacheClearedNotice, setCacheClearedNotice] = createSignal<boolean>(false);

  onMount(async () => {
    try {
      const all = await JamBaseService.getMetros();
      if (all.length > 0) setMetrosList(all);
    } catch (_) {}
  });

  const updateSetting = (key: keyof JamBaseSettings, value: any) => {
    const updated = JamBaseService.saveSettings({ [key]: value });
    setJamBaseSettings(updated);
  };

  const handleSelectMetro = (metro: JamBaseMetro) => {
    const updated = JamBaseService.saveSettings({
      metroId: metro.identifier,
      metroName: metro.name,
    });
    setJamBaseSettings(updated);
    setSearchCityQuery("");
    setCitySearchResults([]);
  };

  const handleSearchCity = async () => {
    const q = searchCityQuery().trim();
    if (!q) return;
    setIsSearchingCity(true);
    try {
      const res = await JamBaseService.searchCitiesOrMetros(q);
      setCitySearchResults(res);
    } catch (_) {
    } finally {
      setIsSearchingCity(false);
    }
  };

  const handleClearCache = () => {
    JamBaseService.clearAllCache();
    setCacheClearedNotice(true);
    setTimeout(() => setCacheClearedNotice(false), 3000);
  };

  return (
    <div
      class="overflow-x-hidden overflow-y-auto w-screen p-4 max-w-2xl mx-auto flex flex-col gap-4"
      style="height: calc(100vh - 128px);"
    >
      <div class="flex items-center justify-between px-1">
        <h1 class="text-lg font-bold">Settings</h1>
        <span class="text-xs text-base-content/60 font-mono">v{import.meta.env.VITE_APP_VERSION}</span>
      </div>

      {/* Theme Section */}
      <div class="card bg-base-200 shadow-sm">
        <div class="card-body p-4 sm:p-6">
          <div class="flex items-center justify-between mb-2">
            <div>
              <h2 class="card-title text-base">Theme</h2>
              <p class="text-xs text-base-content/60">Quickly switch between themes</p>
            </div>
            <span class="badge badge-primary capitalize font-medium px-3 py-2">{appTheme()}</span>
          </div>

          <div class="flex flex-col gap-3 mt-1">
            <div>
              <span class="text-xs font-semibold uppercase tracking-wider text-base-content/50 block mb-1.5">
                Dark Themes
              </span>
              <div class="flex flex-wrap gap-1.5">
                <For each={darkThemes}>
                  {(t) => (
                    <button
                      type="button"
                      onClick={() => setAppTheme(t)}
                      class={`btn btn-xs sm:btn-sm capitalize ${
                        appTheme() === t ? "btn-primary" : "btn-ghost bg-base-100 hover:bg-base-300"
                      }`}
                    >
                      {t}
                    </button>
                  )}
                </For>
              </div>
            </div>

            <div class="divider my-0.5"></div>

            <div>
              <span class="text-xs font-semibold uppercase tracking-wider text-base-content/50 block mb-1.5">
                Light Themes
              </span>
              <div class="flex flex-wrap gap-1.5">
                <For each={lightThemes}>
                  {(t) => (
                    <button
                      type="button"
                      onClick={() => setAppTheme(t)}
                      class={`btn btn-xs sm:btn-sm capitalize ${
                        appTheme() === t ? "btn-primary" : "btn-ghost bg-base-100 hover:bg-base-300"
                      }`}
                    >
                      {t}
                    </button>
                  )}
                </For>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Font Size Section */}
      <div class="card bg-base-200 shadow-sm">
        <div class="card-body p-4 sm:p-6">
          <div class="flex items-center justify-between mb-2">
            <div>
              <h2 class="card-title text-base">Font Size</h2>
              <p class="text-xs text-base-content/60">Adjust interface font size</p>
            </div>
            <span class="badge badge-primary capitalize font-medium px-3 py-2">
              {fontSizes.find((f) => f.id === fontSize())?.label || fontSize()}
            </span>
          </div>

          <div class="flex flex-wrap gap-1.5 mt-1">
            <For each={fontSizes}>
              {(sizeOption) => (
                <button
                  type="button"
                  onClick={() => setFontSize(sizeOption.id)}
                  class={`btn btn-xs sm:btn-sm ${
                    fontSize() === sizeOption.id
                      ? "btn-primary"
                      : "btn-ghost bg-base-100 hover:bg-base-300"
                  }`}
                >
                  {sizeOption.label}
                </button>
              )}
            </For>
          </div>
        </div>
      </div>

      {/* Playback Section */}
      <div class="card bg-base-200 shadow-sm">
        <div class="card-body p-4 sm:p-6">
          <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="card-title text-base">Auto-Play Next Song</h2>
                <p class="text-xs text-base-content/60">
                  Automatically play the next song in the list when playback ends
                </p>
              </div>
              <input
                type="checkbox"
                class="toggle toggle-primary"
                checked={autoPlayNext()}
                onChange={(e) => setAutoPlayNext(e.currentTarget.checked)}
                aria-label="Auto-Play Next Song"
              />
            </div>

            <div class="divider my-0"></div>

            <div class="flex items-center justify-between">
              <div>
                <h2 class="card-title text-base">Auto-Play on Song Info Open</h2>
                <p class="text-xs text-base-content/60">Automatically play song when song info is opened</p>
              </div>
              <input
                type="checkbox"
                class="toggle toggle-primary"
                checked={autoPlayOnOpen()}
                onChange={(e) => setAutoPlayOnOpen(e.currentTarget.checked)}
                aria-label="Auto-Play on Song Info Open"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Concerts & Events (JamBase) Section */}
      <div class="card bg-base-200 shadow-sm">
        <div class="card-body p-4 sm:p-6">
          <div class="flex items-center justify-between mb-2">
            <div>
              <h2 class="card-title text-base flex items-center gap-2">
                Concerts & Events
                <span class="badge badge-primary badge-sm text-[10px] uppercase font-bold tracking-wider">
                  JamBase
                </span>
              </h2>
              <p class="text-xs text-base-content/60">
                Select your primary metro area to discover local concerts for your artists
              </p>
            </div>
          </div>

          <div class="flex flex-col gap-4 mt-2">
            {/* Active Metro & Quick Presets */}
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-xs font-semibold text-base-content/80">Primary Metro Area</span>
                <span class="badge badge-primary font-mono text-xs">{jamBaseSettings().metroName}</span>
              </div>

              {/* Quick Select Buttons */}
              <div class="flex flex-wrap gap-1.5 mt-2">
                <For each={POPULAR_METROS.slice(0, 8)}>
                  {(m) => (
                    <button
                      type="button"
                      class={`btn btn-xs ${
                        jamBaseSettings().metroId === m.identifier
                          ? "btn-primary font-bold"
                          : "btn-ghost bg-base-100 hover:bg-base-300"
                      }`}
                      onClick={() => handleSelectMetro(m)}
                    >
                      {m.name}
                    </button>
                  )}
                </For>
              </div>
            </div>

            {/* City / Metro Search */}
            <div class="pt-2 border-t border-base-300">
              <label class="text-xs font-semibold text-base-content/70 block mb-1">
                Search Other Cities or Metro Areas:
              </label>
              <div class="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Dallas, Los Angeles, London, Berlin..."
                  class="input input-sm input-bordered flex-1"
                  value={searchCityQuery()}
                  onInput={(e) => setSearchCityQuery(e.currentTarget.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchCity()}
                />
                <button
                  type="button"
                  class="btn btn-sm btn-outline btn-primary"
                  onClick={handleSearchCity}
                  disabled={isSearchingCity() || !searchCityQuery().trim()}
                >
                  {isSearchingCity() ? "Searching..." : "Search"}
                </button>
              </div>

              {/* Search Results */}
              <Show when={citySearchResults().length > 0}>
                <div class="mt-2 max-h-40 overflow-y-auto bg-base-100 p-2 rounded-lg border border-base-300 flex flex-col gap-1 text-xs">
                  <For each={citySearchResults()}>
                    {(res) => (
                      <div class="flex items-center justify-between p-1.5 hover:bg-base-200 rounded">
                        <div>
                          <span class="font-medium block">{res.name}</span>
                          <span class="text-[10px] text-base-content/50 font-mono">{res.identifier}</span>
                        </div>
                        <button
                          type="button"
                          class="btn btn-xs btn-primary btn-outline"
                          onClick={() => handleSelectMetro(res)}
                        >
                          Select
                        </button>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>

            <div class="divider my-0"></div>

            {/* Days Limit */}
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label class="text-xs font-semibold text-base-content/80 block">Upcoming Window</label>
                <span class="text-[11px] text-base-content/50">How far ahead to look for shows</span>
              </div>
              <div class="flex flex-wrap gap-1.5">
                <For each={DAYS_OPTIONS}>
                  {(days) => (
                    <button
                      type="button"
                      onClick={() => updateSetting("daysLimit", days)}
                      class={`btn btn-xs ${
                        jamBaseSettings().daysLimit === days
                          ? "btn-primary"
                          : "btn-ghost bg-base-100 hover:bg-base-300"
                      }`}
                    >
                      {days} days
                    </button>
                  )}
                </For>
              </div>
            </div>

            <div class="divider my-0.5"></div>

            {/* Navigation to Events View & Cache Actions */}
            <div class="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
              <button
                type="button"
                class="btn btn-sm btn-primary w-full sm:w-auto gap-2"
                onClick={() => props.onOpenEvents?.()}
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                View Upcoming Concerts
              </button>

              <div class="flex items-center gap-2">
                <Show when={cacheClearedNotice()}>
                  <span class="text-xs text-success font-medium">Cache cleared!</span>
                </Show>
                <button
                  type="button"
                  class="btn btn-xs btn-ghost text-base-content/60 hover:text-error"
                  onClick={handleClearCache}
                  title="Clear all local JamBase event caches"
                >
                  Clear Event Cache
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
