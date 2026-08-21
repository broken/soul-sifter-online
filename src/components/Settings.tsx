import { type Component, For } from "solid-js"

import { useTheme, darkThemes, lightThemes } from "./ThemeContext"
import { useFontSize, fontSizes } from "./FontSizeContext"
import { useAutoPlay } from "./AutoPlayContext"

const Settings: Component = () => {
  const { appTheme, setAppTheme } = useTheme();
  const { fontSize, setFontSize } = useFontSize();
  const { autoPlayNext, setAutoPlayNext, autoPlayOnOpen, setAutoPlayOnOpen } = useAutoPlay();

  return (
    <div class="overflow-x-hidden overflow-y-auto w-screen p-4 max-w-2xl mx-auto flex flex-col gap-4" style="height: calc(100vh - 128px);">
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
              <span class="text-xs font-semibold uppercase tracking-wider text-base-content/50 block mb-1.5">Dark Themes</span>
              <div class="flex flex-wrap gap-1.5">
                <For each={darkThemes}>
                  {(t) => (
                    <button
                      type="button"
                      onClick={() => setAppTheme(t)}
                      class={`btn btn-xs sm:btn-sm capitalize ${appTheme() === t ? 'btn-primary' : 'btn-ghost bg-base-100 hover:bg-base-300'}`}
                    >
                      {t}
                    </button>
                  )}
                </For>
              </div>
            </div>

            <div class="divider my-0.5"></div>

            <div>
              <span class="text-xs font-semibold uppercase tracking-wider text-base-content/50 block mb-1.5">Light Themes</span>
              <div class="flex flex-wrap gap-1.5">
                <For each={lightThemes}>
                  {(t) => (
                    <button
                      type="button"
                      onClick={() => setAppTheme(t)}
                      class={`btn btn-xs sm:btn-sm capitalize ${appTheme() === t ? 'btn-primary' : 'btn-ghost bg-base-100 hover:bg-base-300'}`}
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
                  class={`btn btn-xs sm:btn-sm ${fontSize() === sizeOption.id ? 'btn-primary' : 'btn-ghost bg-base-100 hover:bg-base-300'}`}
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
                <p class="text-xs text-base-content/60">Automatically play the next song in the list when playback ends</p>
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
    </div>
  )
}

export default Settings


