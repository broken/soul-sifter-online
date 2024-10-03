// src/App.tsx

import { onAuthStateChanged } from 'firebase/auth'
import { createSignal, onCleanup } from 'solid-js'

import { auth, signInWithGoogle, logOut } from '../firebase'
import App from './App'


const Login = () => {
  const [user, setUser] = createSignal<null | any>(null)

  // Listen for authentication state changes
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user &&  user.uid === import.meta.env.VITE_APP_USER_ID) {
      setUser(user)
    } else {
      setUser(null)
    }
  })

  // Cleanup listener on component unmount
  onCleanup(() => unsubscribe())

  return (
    <>
      {user() ? (
        <App />
      ) : (
        <div class="flex flex-col h-screen w-screen overflow-hidden justify-center gap-3">
          <h1 style="margin: 0 auto">Soul Sifter Online</h1>
          <button class="btn border-primary text-primary" onClick={signInWithGoogle}  style="margin: 0 auto">Experience</button>
        </div>
      )}
    </>
  )
}

export default Login
