import { Setter, type Component, createSignal, Show, onMount, onCleanup } from 'solid-js'; // Added onMount, onCleanup
import CreateYouTubePlaylistModal from './CreateYouTubePlaylistModal';
import { debouncedSearchQuery } from './SearchToolbar';
import { useGenres } from './GenresContext';
import type { Style } from '../model.types';
import { supabase } from './App';


const NavBar: Component<{start: (fn: () => void, cb?: () => void) => void, setTab: Setter<number>}> = (props) => {
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = createSignal(false);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = createSignal(false);
  const [isYouTubeConnected, setIsYouTubeConnected] = createSignal(false); // Signal for YouTube connection status
  const genresCtx = useGenres();

  onMount(() => {
    // Set initial state from localStorage
    setIsYouTubeConnected(localStorage.getItem('youtubeConnected') === 'true');

    // Listen for direct changes to localStorage (e.g., from other tabs or OAuth callback)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'youtubeConnected') {
        setIsYouTubeConnected(event.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Listen for custom event from App.tsx after URL processing
    const handleConnectionChangedEvent = (event: CustomEvent) => {
        if (event.detail && typeof event.detail.connected === 'boolean') {
            setIsYouTubeConnected(event.detail.connected);
        }
    };
    window.addEventListener('youtubeConnectionChanged', handleConnectionChangedEvent as EventListener);


    // Cleanup listeners
    onCleanup(() => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('youtubeConnectionChanged', handleConnectionChangedEvent as EventListener);
    });
  });

  const handleLinkYouTubeAccount = () => {
    // TODO: Move this to a dedicated settings page/area.
    // User needs to replace <YOUR_SUPABASE_PROJECT_REF> with their actual Supabase project reference.
    const supabaseProjectRef = "<YOUR_SUPABASE_PROJECT_REF>";

    if (supabaseProjectRef === "<YOUR_SUPABASE_PROJECT_REF>" || !supabaseProjectRef) {
      alert("Developer: Please replace '<YOUR_SUPABASE_PROJECT_REF>' with your actual Supabase project reference in NavBar.tsx to enable YouTube linking.");
      return;
    }
    const functionUrl = `https://${supabaseProjectRef}.supabase.co/functions/v1/youtube-oauth-start`;

    // Optional: Display a message before redirecting
    // alert("Redirecting to Google to link your YouTube account...");
    window.location.href = functionUrl;
  };

  // Async function to handle playlist creation
  const handleCreateYouTubePlaylist = async (playlistName: string) => {
    if (!genresCtx) {
      console.error("Genres context is not available");
      alert("Could not create playlist. Genres context missing."); // User-friendly message
      return;
    }
    setIsCreatingPlaylist(true);
    try {
      const currentQuery = debouncedSearchQuery();
      const activeGenreObjects: Style[] = genresCtx.activeGenres(); // Explicitly type for clarity
      const currentGenreIds = activeGenreObjects.map(genre => genre.id); // Assuming genre objects have an 'id' property

      console.log('Initiating playlist creation with Edge Function:', {
        playlistName,
        currentQuery,
        currentGenreIds,
      });

      // Call the Edge Function
      const { data: newPlaylistData, error: functionError } = await supabase.functions.invoke('create-youtube-playlist', {
        body: {
          playlistName: playlistName,
          searchQuery: currentQuery,
          genreIds: currentGenreIds
        }
      });

      if (functionError) {
        console.error('Error calling create-youtube-playlist Edge Function:', functionError);
        alert(`Failed to create playlist: ${functionError.message}`);
        // Optionally, provide more detailed error from functionError.details if available and user-friendly
      } else if (newPlaylistData) {
        // The Edge function returns data in a specific structure, ensure to access it correctly.
        // Assuming newPlaylistData directly contains the playlist details or a success message.
        console.log('Successfully created playlist via Edge Function:', newPlaylistData);

        // Check if the function returned a supabasePlaylist object with a name
        const createdPlaylistName = newPlaylistData.supabasePlaylist?.name || playlistName;

        alert(`Playlist '${createdPlaylistName}' creation process initiated successfully! Check YouTube and app in a moment.`);

        // Dispatch an event to notify PlaylistList to refresh
        window.dispatchEvent(new CustomEvent('playlistCreated'));
        setIsYouTubeModalOpen(false); // Close modal on success
      } else {
        // Handle cases where there's no error but also no data (should not happen with well-formed functions)
        console.warn('Edge function returned no data and no error.');
        alert('Playlist creation process finished with an unexpected response.');
      }
    } catch (error) { // Catch errors from the try block itself (e.g. network issues before invoking)
      console.error('Exception during handleCreateYouTubePlaylist:', error);
      alert(`An unexpected error occurred: ${error.message}`);
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  const updateTab = (index: number) => () => {
    props.start(() => props.setTab(index))
    const botNavBarElements = document.querySelectorAll('.bot-nav-bar')
    for (const element of botNavBarElements) {
      if (element.classList.contains('active')) {
        element.classList.remove('active')
      }
    }
    botNavBarElements[index].classList.add('active')
  }
  return (
    <div class="btm-nav bg-primary-content text-primary">
      <button class="bot-nav-bar active" onClick={updateTab(0)}>
        <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
          <path fill-rule="evenodd" d="M9 7V2.2a2 2 0 0 0-.5.4l-4 3.9a2 2 0 0 0-.3.5H9Zm2 0V2h7a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9h5a2 2 0 0 0 2-2Zm2.3 0A1 1 0 0 0 12 8v5.3a4 4 0 0 0-1.5-.3C8.8 13 7 14.1 7 16s1.8 3 3.5 3 3.5-1.1 3.5-3V9.8a3 3 0 0 1 1 2.2 1 1 0 1 0 2 0 5 5 0 0 0-1.9-3.9 6.4 6.4 0 0 0-1.8-1ZM9 16c0-.4.5-1 1.5-1s1.5.6 1.5 1-.5 1-1.5 1S9 16.4 9 16Z" clip-rule="evenodd"/>
        </svg>
        <span class="btm-nav-label">Songs</span>
      </button>
      <button class="bot-nav-bar" onClick={updateTab(1)}>
        <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
          <path fill-rule="evenodd" d="M4 4a2 2 0 0 0-2 2v12.6l3-8a1 1 0 0 1 1-.6h12V9a2 2 0 0 0-2-2h-4.5l-2-2.3A2 2 0 0 0 8 4H4Zm2.7 8h-.2l-3 8H18l3-8H6.7Z" clip-rule="evenodd"/>
        </svg>
        <span class="btm-nav-label">Genres</span>
      </button>
      <button class="bot-nav-bar" onClick={updateTab(2)}>
        <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
          <path fill-rule="evenodd" d="M17.3 4a1 1 0 0 0-.9.2 1 1 0 0 0-.4.8v8.6c-.6-.3-1.3-.5-2-.5-2 0-4 1.4-4 3.5 0 2 2 3.4 4 3.4s4-1.3 4-3.4V6.8a3 3 0 0 1 1 2.3c0 .5.4 1 1 1s1-.5 1-1a5 5 0 0 0-1.9-4 6.4 6.4 0 0 0-1.8-1ZM4 5a1 1 0 0 0-1 1c0 .6.4 1 1 1h9c.6 0 1-.4 1-1 0-.5-.4-1-1-1H4Zm0 4a1 1 0 0 0-1 1c0 .6.4 1 1 1h9c.6 0 1-.4 1-1 0-.5-.4-1-1-1H4Zm0 4.1a1 1 0 0 0-1 1c0 .6.4 1 1 1h4c.6 0 1-.4 1-1 0-.5-.4-1-1-1H4Z" clip-rule="evenodd"/>
        </svg>
        <span class="btm-nav-label">Playlists</span>
      </button>
      <button class="bot-nav-bar" onClick={updateTab(3)}>
        <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12.25V1m0 11.25a2.25 2.25 0 0 0 0 4.5m0-4.5a2.25 2.25 0 0 1 0 4.5M4 19v-2.25m6-13.5V1m0 2.25a2.25 2.25 0 0 0 0 4.5m0-4.5a2.25 2.25 0 0 1 0 4.5M10 19V7.75m6 4.5V1m0 11.25a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5ZM16 19v-2"/>
        </svg>
        <span class="btm-nav-label">Settings</span>
      </button>
      {/* New Button for YouTube Playlist Modal */}
      <button class="bot-nav-bar" onClick={() => setIsYouTubeModalOpen(true)}>
        {/* Placeholder for an icon, similar to other buttons */}
        <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
          {/* Simple placeholder icon - will need a proper one */}
          <path d="M19.618 13.031A4.25 4.25 0 0 0 16 11.469V9.75a.75.75 0 0 0-1.5 0v1.25a.75.75 0 0 0 .469.7c.448.153.86.38 1.23.672a5.735 5.735 0 0 1 1.8 3.983V17.5a.75.75 0 0 0 1.5 0v-.5a4.252 4.252 0 0 0-1.382-3.219ZM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm-.75-5.25a.75.75 0 0 0-1.5 0V17a.75.75 0 0 0 1.5 0v-2.25Zm8.25-.75a.75.75 0 0 0-.75-.75H16a.75.75 0 0 0 0 1.5h2.75a.75.75 0 0 0 .75-.75Z"/>
        </svg>
        <span class="btm-nav-label">YT Playlist</span>
      </button>
      {/* TODO: This button should ideally be in a Settings page */}
      <Show
        when={!isYouTubeConnected()}
        fallback={
          <button class="bot-nav-bar" disabled title="YouTube account is linked. To re-link, manage in YouTube settings or clear site data.">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-success" viewBox="0 0 24 24" fill="currentColor"> {/* Green icon */}
              <path d="M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.269,4,12,4,12,4S5.731,4,4.186,4.418 c-0.86,0.23-1.538,0.908-1.768,1.768C2,7.731,2,12,2,12s0,4.269,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768 C5.731,20,12,20,12,20s6.269,0,7.814-0.418c0.861-0.23,1.538-0.908,1.768-1.768C22,16.269,22,12,22,12S22,7.731,21.582,6.186z M10,15.464V8.536L16,12L10,15.464z" />
            </svg>
            <span class="btm-nav-label">YouTube Linked</span>
          </button>
        }
      >
        <button class="bot-nav-bar" onClick={handleLinkYouTubeAccount}>
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.269,4,12,4,12,4S5.731,4,4.186,4.418 c-0.86,0.23-1.538,0.908-1.768,1.768C2,7.731,2,12,2,12s0,4.269,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768 C5.731,20,12,20,12,20s6.269,0,7.814-0.418c0.861-0.23,1.538-0.908,1.768-1.768C22,16.269,22,12,22,12S22,7.731,21.582,6.186z M10,15.464V8.536L16,12L10,15.464z" />
          </svg>
          <span class="btm-nav-label">Link YouTube</span>
        </button>
      </Show>
    </div>
    <CreateYouTubePlaylistModal
      isOpen={isYouTubeModalOpen()}
      isCreating={isCreatingPlaylist()}
      onClose={() => setIsYouTubeModalOpen(false)}
      onCreate={handleCreateYouTubePlaylist}
    />
  </>
  );
}

export default NavBar
