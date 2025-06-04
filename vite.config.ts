/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa'
import type { ManifestOptions, VitePWAOptions } from 'vite-plugin-pwa'
import solidPlugin from 'vite-plugin-solid';
// import devtools from 'solid-devtools/vite';

const pwaOptions: Partial<VitePWAOptions> = {
  base: '/',
  includeAssets: ['favicon.svg', 'icon_*.png'],
  manifest: {
    name: "Soul Sifter Online",
    short_name: "SSO",
    theme_color: '#ffffff',
    start_url: "https://soul-sifter.web.app/",
    display: "standalone",
    icons: [
      {
        src: 'assets/icon_192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/assets/icon_512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: 'assets/icon_512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
    screenshots: [
      {
        src: '/assets/screenshot_narrow.png',
        type: 'image/png',
        sizes: '596x814',
        form_factor: 'narrow',
      },
      {
        src: '/assets/screenshot_wide.png',
        type: 'image/png',
        sizes: '947x512',
        form_factor: 'wide',
      },
    ],
  },
  devOptions: {
    enabled: process.env.SW_DEV === 'true',
    /* when using generateSW the PWA plugin will switch to classic */
    type: 'module',
    navigateFallback: 'index.html',
  },
}

export default defineConfig({
  plugins: [
    /*
    Uncomment the following line to enable solid-devtools.
    For more info see https://github.com/thetarnav/solid-devtools/tree/main/packages/extension#readme
    */
    // devtools(),
    solidPlugin(),
    VitePWA(pwaOptions),
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // setupFiles: './setupTests.ts', // If needed later for global test setup
    transformMode: {
      web: [/\.[jt]sx?$/],
    },
    deps: {
      // Ensure solid-js and its submodules are transformed in the test environment
      inline: [/solid-js/, /@solidjs\/testing-library/],
    },
    // To fix "Cannot find module 'solid-js/web'":
    // alias: [
    //   {
    //     find: /^(solid-js|solid-js\/web|solid-js\/store|solid-js\/html|solid-js\/h)$/,
    //     replacement: 'solid-js/dist/solid.js', // This might point to prod build
    //   },
    // ],
  },
  resolve: {
    conditions: ['development', 'solid'],
  }
});
