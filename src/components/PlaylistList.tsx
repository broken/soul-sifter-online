import { type Component, createResource, Index, DEV, onMount, onCleanup } from 'solid-js' // Added onMount, onCleanup

import { supabase } from './App'
import { Playlist } from '../model.types' // Ensure Playlist type is correctly defined/imported
import PlaylistListItem from './PlaylistListItem'


const PlaylistList: Component = () => {
  // Destructure refetch from createResource
  const [playlists, { refetch }] = createResource<Playlist[]>(async () => {
    let playlistsList: Playlist[] = []
    // Added .order('name', { ascending: true }) to match previous sort logic directly in query
    const { data, error } = await supabase.from('playlists').select().order('name', { ascending: true });
    if (error) {
      console.error('Error fetching playlists:', error)
      return []; // Return empty array on error
    }
    if (data && DEV) {
      console.log('Fetched playlists:', data);
    }
    return data || []; // Return data or empty array if data is null
  });

  const handlePlaylistCreated = () => {
    console.log('playlistCreated event received in PlaylistList, refetching playlists...');
    refetch();
  };

  onMount(() => {
    window.addEventListener('playlistCreated', handlePlaylistCreated);
    console.log('PlaylistList: Added event listener for playlistCreated.');
  });

  onCleanup(() => {
    window.removeEventListener('playlistCreated', handlePlaylistCreated);
    console.log('PlaylistList: Removed event listener for playlistCreated.');
  });

  return (
    <div class="overflow-x-hidden overflow-y-scroll w-screen" style="height: calc(100vh - 128px);">
      <table class="table">
        <tbody>
          <Index each={playlists()}>
            {playlist => <PlaylistListItem playlist={playlist()} />}
          </Index>
        </tbody>
      </table>
    </div>
  )
}

export default PlaylistList
