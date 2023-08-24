import type { Component } from 'solid-js';

import logo from './logo.svg';
import styles from './App.module.css';
import SongList from './components/SongList';

const App: Component = () => {
  return (
    <div class={styles.App}>
      <header class={styles.header}>
        <img src={logo} class={styles.logo} alt="logo" />
        <SongList />
      </header>
    </div>
  );
};

export default App;
