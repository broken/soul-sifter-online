import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { stringify as formUrlEncode } from 'https://deno.land/std@0.177.0/node/querystring.ts';
import { searchSongs, OrderBy } from '../../../src/lib/search/SearchUtil.ts'
import type { Song } from '../../../src/model.types.ts';

const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

console.log('Create YouTube Playlist Edge Function initializing (v3 - OAuth)...');

function handleCORS(responseHeaders: Headers): Headers {
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  responseHeaders.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  return responseHeaders;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to get a new Access Token using the Refresh Token
async function getAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string | null> {
  console.log('Attempting to refresh access token...');
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formUrlEncode({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Failed to refresh access token:', data);
      return null;
    }
    console.log('Access token refreshed successfully.');
    return data.access_token;
  } catch (error) {
    console.error('Exception while refreshing access token:', error);
    return null;
  }
}


serve(async (req: Request) => {
  let responseHeaders = new Headers();
  handleCORS(responseHeaders);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: responseHeaders, status: 204 });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      headers: { ...responseHeaders, 'Content-Type': 'application/json' }, status: 405,
    });
  }

  let supabaseClient: SupabaseClient;
  let youtubeApiKey: string | undefined;
  let youtubeClientId: string | undefined;
  let youtubeClientSecret: string | undefined;
  let youtubeRefreshToken: string | undefined;

  try {
    // Essential Supabase creds
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Supabase URL or Service Key is missing.');
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // YouTube API Key (for search)
    youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
    if (!youtubeApiKey) throw new Error('YOUTUBE_API_KEY is missing.');

    // YouTube OAuth creds
    youtubeClientId = Deno.env.get('YOUTUBE_CLIENT_ID');
    youtubeClientSecret = Deno.env.get('YOUTUBE_CLIENT_SECRET');
    youtubeRefreshToken = Deno.env.get('YOUTUBE_REFRESH_TOKEN');
    if (!youtubeClientId || !youtubeClientSecret || !youtubeRefreshToken) {
      throw new Error('YouTube OAuth credentials (Client ID, Secret, or Refresh Token) are missing.');
    }

  } catch (e) {
    console.error('Environment variable configuration error:', e.message);
    return new Response(JSON.stringify({ error: 'Server configuration error', details: e.message }), {
      headers: { ...responseHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }

  // Get Access Token early
  const accessToken = await getAccessToken(youtubeClientId, youtubeClientSecret, youtubeRefreshToken);
  if (!accessToken) {
    console.error('Failed to obtain YouTube Access Token using Refresh Token.');
    return new Response(JSON.stringify({ error: 'Authentication failed: Could not obtain YouTube access token.' }), {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }, status: 401, // Unauthorized or 500
    });
  }
  console.log('Successfully obtained YouTube Access Token.');

  try {
    const body = await req.json();
    const { playlistName, searchQuery, genreIds } = body;
    if (!playlistName || typeof playlistName !== 'string' || (searchQuery && typeof searchQuery !== 'string') || !Array.isArray(genreIds) || !genreIds.every(id => typeof id === 'number')) {
      return new Response(JSON.stringify({ error: 'Invalid request parameters' }), {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }, status: 400,
      });
    }

    const fetchedSongs: Song[] = await searchSongs(
      supabaseClient, searchQuery || '', 200, 0, '', genreIds, [], [], 0, 0, OrderBy.DATE_ADDED
    );
    if (fetchedSongs.length === 0) return new Response(JSON.stringify({ message: 'No songs found for the given criteria.' }), { headers: responseHeaders, status: 200 });

    const videoIdsToSync: string[] = [];
    for (const song of fetchedSongs) {
      await delay(200); // Reduced delay slightly, assuming token refresh is less frequent than per-song key use
      if (song.youtubeid && song.youtubeid.length > 5) {
        videoIdsToSync.push(song.youtubeid);
      } else {
        const ytSearchQuery = encodeURIComponent(`${song.artist} ${song.title}`);
        // Search still uses API Key as it's simpler and often allowed for public search
        const searchUrl = `${YOUTUBE_API_BASE_URL}/search?part=snippet&q=${ytSearchQuery}&type=video&maxResults=1&key=${youtubeApiKey}`;
        try {
          const ytSearchRes = await fetch(searchUrl);
          if (!ytSearchRes.ok) {
            const errorData = await ytSearchRes.json().catch(() => ({}));
            console.warn(`YouTube search API error for "${song.artist} ${song.title}": ${ytSearchRes.status}`, errorData);
            continue;
          }
          const searchData = await ytSearchRes.json();
          if (searchData.items && searchData.items.length > 0) {
            const videoId = searchData.items[0].id.videoId;
            videoIdsToSync.push(videoId);
            const { error: updateError } = await supabaseClient.from('songs').update({ youtubeid: videoId }).eq('id', song.id);
            if (updateError) console.error(`Failed to update song ${song.id} with youtubeid ${videoId}:`, updateError);
            else console.log(`Updated song ${song.id} with youtubeid ${videoId}`);
          } else console.log(`No YouTube video found for "${song.artist} ${song.title}".`);
        } catch (e) { console.error(`Exception during YouTube search for "${song.artist} ${song.title}":`, e); continue; }
      }
    }

    if (videoIdsToSync.length === 0) return new Response(JSON.stringify({ message: 'No YouTube videos could be found or synced.' }), { headers: responseHeaders, status: 200 });

    let newYouTubePlaylistId: string | undefined;
    try {
      console.log(`Creating YouTube playlist (OAuth): "${playlistName}"`);
      const playlistInsertUrl = `${YOUTUBE_API_BASE_URL}/playlists?part=snippet,status`; // No API key in URL
      const ytPlaylistRes = await fetch(playlistInsertUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          snippet: { title: playlistName, description: `Created by app. Query: ${searchQuery || 'N/A'}. Genres: ${genreIds.join(', ')}` },
          status: { privacyStatus: 'private' },
        }),
      });
      if (!ytPlaylistRes.ok) {
        const errorData = await ytPlaylistRes.json().catch(() => ({ message: "Unknown error during playlist creation."}));
        throw new Error(`YouTube playlist creation API error (${ytPlaylistRes.status}): ${errorData.error?.message || errorData.message}`);
      }
      const playlistData = await ytPlaylistRes.json();
      newYouTubePlaylistId = playlistData.id;
      console.log(`YouTube playlist created successfully: ID ${newYouTubePlaylistId}`);
    } catch (e) {
        console.error('Exception during YouTube playlist creation (OAuth):', e);
        return new Response(JSON.stringify({ error: 'Exception creating YouTube playlist', details: e.message }), {
            headers: { ...responseHeaders, 'Content-Type': 'application/json' }, status: 500,
        });
    }
    if (!newYouTubePlaylistId) throw new Error('Failed to obtain new YouTube Playlist ID.');


    console.log(`Adding ${videoIdsToSync.length} items to YouTube playlist ${newYouTubePlaylistId} (OAuth)`);
    for (const videoId of videoIdsToSync) {
      await delay(200);
      try {
        const playlistItemInsertUrl = `${YOUTUBE_API_BASE_URL}/playlistItems?part=snippet`; // No API key in URL
        const itemRes = await fetch(playlistItemInsertUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            snippet: { playlistId: newYouTubePlaylistId, resourceId: { kind: 'youtube#video', videoId: videoId } },
          }),
        });
        if (!itemRes.ok) {
          const errorData = await itemRes.json().catch(() => ({}));
          console.warn(`Failed to add video ${videoId} to playlist ${newYouTubePlaylistId} (OAuth):`, itemRes.status, errorData);
        } else console.log(`Added video ${videoId} to playlist ${newYouTubePlaylistId} (OAuth)`);
      } catch (e) { console.warn(`Exception adding video ${videoId} to playlist (OAuth):`, e); }
    }

    const { data: newSupabasePlaylist, error: insertPlaylistError } = await supabaseClient
      .from('playlists')
      .insert({ name: playlistName, query: searchQuery, youtubeid: newYouTubePlaylistId })
      .select().single();

    if (insertPlaylistError) {
      console.error('Failed to insert playlist into Supabase:', insertPlaylistError);
      return new Response(JSON.stringify({ error: 'YouTube playlist created, but failed to save to database.', youtubePlaylistId: newYouTubePlaylistId, details: insertPlaylistError.message }), {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }, status: 500,
      });
    }

    console.log('Playlist successfully created in Supabase:', newSupabasePlaylist);
    return new Response(JSON.stringify({ message: 'YouTube playlist created and synced successfully using OAuth!', supabasePlaylist: newSupabasePlaylist }), {
      headers: { ...responseHeaders, 'Content-Type': 'application/json' }, status: 200,
    });

  } catch (error) {
    console.error('Unhandled error in Edge Function main try block:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      headers: { ...responseHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }
});

console.log('Create YouTube Playlist Edge Function (v3 - OAuth) is ready to serve.');
