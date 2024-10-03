import { Show, type Component, createSignal, createEffect, Index } from "solid-js"

const Settings: Component = () => {
  const [theme, setTheme] = createSignal('soul')
  createEffect(() => {
    document.querySelector('html')!.setAttribute('data-theme', theme())
  })
  const themes: string[] = ['default', 'light', 'dark', 'soul', 'sifter', 'acid', 'aqua', 'autumn', 'black', 'bumblebee', 'business',
                            'cmyk', 'coffee', 'corporate', 'cupcake', 'cyberpunk', 'dracula', 'emerald', 'fantasy', 'forest', 'garden',
                            'halloween', 'lemonade', 'lofi', 'luxury', 'night', 'pastel', 'retro', 'synthwave', 'winter', 'wireframe']

  return (
    <div class="overflow-x-hidden overflow-y-scroll w-screen" style="height: calc(100vh - 128px);">
      <table class="table">
        <tbody>
          <Index each={themes}>
            {t => (
              <tr onclick={() => setTheme(t())}>
                <td class="px-0 py-0">
                  <div class="flex flex-row justify-between px-7 py-4">
                    <span class="label-text">{t()}</span>
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
