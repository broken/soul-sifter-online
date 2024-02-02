import { Setter, type Component } from 'solid-js';


const NavBar: Component<{start: (fn: () => void, cb?: () => void) => void, setTab: Setter<number>}> = (props) => {
  const updateTab = (index: number) => () => {
    props.start(() => props.setTab(index));
    const botNavBarElements = document.querySelectorAll('.bot-nav-bar');
    for (const element of botNavBarElements) {
      if (element.classList.contains('active')) {
        element.classList.remove('active');
      }
    }
    botNavBarElements[index].classList.add('active');
  };
  return (
    <div class="btm-nav bg-base-300">
      <button class="bot-nav-bar text-primary active" onClick={updateTab(0)}>
        <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
          <path fill-rule="evenodd" d="M9 7V2.2a2 2 0 0 0-.5.4l-4 3.9a2 2 0 0 0-.3.5H9Zm2 0V2h7a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9h5a2 2 0 0 0 2-2Zm2.3 0A1 1 0 0 0 12 8v5.3a4 4 0 0 0-1.5-.3C8.8 13 7 14.1 7 16s1.8 3 3.5 3 3.5-1.1 3.5-3V9.8a3 3 0 0 1 1 2.2 1 1 0 1 0 2 0 5 5 0 0 0-1.9-3.9 6.4 6.4 0 0 0-1.8-1ZM9 16c0-.4.5-1 1.5-1s1.5.6 1.5 1-.5 1-1.5 1S9 16.4 9 16Z" clip-rule="evenodd"/>
        </svg>
        <span class="btm-nav-label">Songs</span>
      </button>
      <button class="bot-nav-bar text-primary" onClick={updateTab(1)}>
        <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
          <path fill-rule="evenodd" d="M4 4a2 2 0 0 0-2 2v12.6l3-8a1 1 0 0 1 1-.6h12V9a2 2 0 0 0-2-2h-4.5l-2-2.3A2 2 0 0 0 8 4H4Zm2.7 8h-.2l-3 8H18l3-8H6.7Z" clip-rule="evenodd"/>
        </svg>
        <span class="btm-nav-label">Genres</span>
      </button>
      <button class="bot-nav-bar text-primary" onClick={updateTab(2)}>
        <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
          <path fill-rule="evenodd" d="M17.3 4a1 1 0 0 0-.9.2 1 1 0 0 0-.4.8v8.6c-.6-.3-1.3-.5-2-.5-2 0-4 1.4-4 3.5 0 2 2 3.4 4 3.4s4-1.3 4-3.4V6.8a3 3 0 0 1 1 2.3c0 .5.4 1 1 1s1-.5 1-1a5 5 0 0 0-1.9-4 6.4 6.4 0 0 0-1.8-1ZM4 5a1 1 0 0 0-1 1c0 .6.4 1 1 1h9c.6 0 1-.4 1-1 0-.5-.4-1-1-1H4Zm0 4a1 1 0 0 0-1 1c0 .6.4 1 1 1h9c.6 0 1-.4 1-1 0-.5-.4-1-1-1H4Zm0 4.1a1 1 0 0 0-1 1c0 .6.4 1 1 1h4c.6 0 1-.4 1-1 0-.5-.4-1-1-1H4Z" clip-rule="evenodd"/>
        </svg>
        <span class="btm-nav-label">Playlists</span>
      </button>
      <button class="bot-nav-bar text-primary" onClick={updateTab(3)}>
        <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12.25V1m0 11.25a2.25 2.25 0 0 0 0 4.5m0-4.5a2.25 2.25 0 0 1 0 4.5M4 19v-2.25m6-13.5V1m0 2.25a2.25 2.25 0 0 0 0 4.5m0-4.5a2.25 2.25 0 0 1 0 4.5M10 19V7.75m6 4.5V1m0 11.25a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5ZM16 19v-2"/>
        </svg>
        <span class="btm-nav-label">Settings</span>
      </button>
    </div>
  );
};

export default NavBar;
