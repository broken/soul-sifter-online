import type { Component } from 'solid-js';

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import logo from './logo.svg';
import styles from './App.module.css';
import SongList from './components/SongList';

// Initialize firebase
const firebaseConfig = {
};
const firebase = initializeApp(firebaseConfig);
const db = getFirestore(firebase);


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
export {db};