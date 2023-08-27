import type { Component } from 'solid-js';

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import logo from './logo.svg';
import styles from './App.module.css';
import SongList from './components/SongList';
import SearchToolbar from './components/SearchToolbar';

// Initialize firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};
const firebase = initializeApp(firebaseConfig);
const db = getFirestore(firebase);


const App: Component = () => {
  return (
    <div class={styles.App}>
      <header class={styles.header}>
        <img src={logo} class={styles.logo} alt="logo" />
        <SearchToolbar />
        <SongList />
      </header>
    </div>
  );
};

export default App;
export {db};