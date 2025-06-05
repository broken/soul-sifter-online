import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

console.log('YouTube OAuth Start Edge Function initializing...');

// Helper to extract project reference from Supabase URL
function getProjectRef(supabaseUrl: string): string | null {
  try {
    const url = new URL(supabaseUrl);
    const parts = url.hostname.split('.');
    if (parts.length >= 3 && parts[1] === 'supabase') { // e.g., projectref.supabase.co or projectref.supabase.red
      return parts[0];
    }
  } catch (e) {
    console.error("Error parsing SUPABASE_URL:", e);
  }
  return null;
}

serve(async (req: Request) => {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 405,
    });
  }

  try {
    const youtubeClientId = Deno.env.get('YOUTUBE_CLIENT_ID');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!youtubeClientId) {
      console.error('Missing YOUTUBE_CLIENT_ID environment variable.');
      return new Response(JSON.stringify({ error: 'Server configuration error: YOUTUBE_CLIENT_ID is not set.' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        status: 500,
      });
    }
    if (!supabaseUrl) {
      console.error('Missing SUPABASE_URL environment variable.');
      return new Response(JSON.stringify({ error: 'Server configuration error: SUPABASE_URL is not set.' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        status: 500,
      });
    }

    const projectRef = getProjectRef(supabaseUrl);
    if (!projectRef) {
        console.error('Could not determine SUPABASE_PROJECT_REF from SUPABASE_URL.');
        return new Response(JSON.stringify({ error: 'Server configuration error: Could not determine SUPABASE_PROJECT_REF.' }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            status: 500,
        });
    }

    const redirectUri = `https://${projectRef}.supabase.co/functions/v1/youtube-oauth-callback`;
    const encodedRedirectUri = encodeURIComponent(redirectUri);

    const scope = 'https://www.googleapis.com/auth/youtube.force-ssl';
    const encodedScope = encodeURIComponent(scope);

    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${youtubeClientId}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=${encodedScope}&access_type=offline&prompt=consent`;

    console.log(`Redirecting to: ${oauthUrl}`);

    return new Response(null, {
      status: 302, // Found (Redirect)
      headers: {
        'Location': oauthUrl,
        'Access-Control-Allow-Origin': '*' // Optional for redirects, but good practice
      },
    });

  } catch (error) {
    console.error('Error in youtube-oauth-start function:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 500,
    });
  }
});

console.log('YouTube OAuth Start Edge Function is ready to serve.');
