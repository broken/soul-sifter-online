import { type Component } from 'solid-js';

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import SongList from './components/SongList';
import SearchToolbar from './components/SearchToolbar';
import SongInfo from './components/SongInfo';
import SongsContext from './components/SongsContext';
import SongContext from './components/SongContext';
import Settings from './components/Settings';

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
    <SongsContext>
      <SongContext>
        <div class="flex flex-col h-screen w-screen overflow-hidden">
          <SearchToolbar />
          <SongList />
          <SongInfo />
          <Settings />
        </div>
      </SongContext>
    </SongsContext>
  );
};

export default App;
export {db};