import { type Component, createEffect, Index } from "solid-js"

import { useTheme, themes } from "./ThemeContext"
import styles from './Settings.module.css'


const Settings: Component = () => {
  const {appTheme, setAppTheme} = useTheme();
  createEffect(() => {
    document.querySelector('html')!.setAttribute('data-theme', appTheme())
  })

  return (
    <div class="overflow-x-hidden overflow-y-scroll w-screen" style="height: calc(100vh - 128px);">
      <table class="table">
        <tbody>
          <Index each={themes}>
            {t => (
              <tr onclick={() => setAppTheme(t())} classList={{ [styles.active]: appTheme() === t() }}>
                <td class="px-0 py-0">
                  <div class="flex flex-row justify-between px-7 py-4">
                    <span>{t()}</span>
                  </div>
                </td>
              </tr>
            )}
          </Index>
        </tbody>
      </table>
    </div>
  )
}

export default Settings
