import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { stringify as formUrlEncode } from 'https://deno.land/std@0.177.0/node/querystring.ts';

console.log('YouTube OAuth Callback Edge Function initializing (v2)...');

// Helper to extract project reference (remains the same)
function getProjectRef(supabaseUrl: string): string | null {
  try {
    const url = new URL(supabaseUrl);
    const parts = url.hostname.split('.');
    if (parts.length >= 3 && parts[1] === 'supabase') {
      return parts[0];
    }
  } catch (e) { console.error("Error parsing SUPABASE_URL:", e); }
  return null;
}

// Define Frontend URL - In production, use an environment variable.
const FRONTEND_REDIRECT_URL = Deno.env.get('FRONTEND_REDIRECT_URL') || 'http://localhost:5173';

serve(async (req: Request) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const errorParam = url.searchParams.get('error');
  const stateParam = url.searchParams.get('state'); // Optional: if you implement state parameter for CSRF

  const headers = { 'Access-Control-Allow-Origin': '*' }; // CORS for error responses if any

  let redirectUrl = new URL(FRONTEND_REDIRECT_URL); // Base redirect URL

  if (errorParam) {
    console.error(`OAuth Error received: ${errorParam}`);
    redirectUrl.searchParams.set('youtube_auth_status', 'error');
    redirectUrl.searchParams.set('error_message', errorParam);
    return Response.redirect(redirectUrl.toString(), 302);
  }

  if (!code) {
    console.error('No authorization code received from Google.');
    redirectUrl.searchParams.set('youtube_auth_status', 'error');
    redirectUrl.searchParams.set('error_message', 'No authorization code provided by Google.');
    return Response.redirect(redirectUrl.toString(), 302);
  }

  try {
    const youtubeClientId = Deno.env.get('YOUTUBE_CLIENT_ID');
    const youtubeClientSecret = Deno.env.get('YOUTUBE_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!youtubeClientId || !youtubeClientSecret || !supabaseUrl) {
      console.error('Missing one or more environment variables: YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, SUPABASE_URL');
      redirectUrl.searchParams.set('youtube_auth_status', 'error');
      redirectUrl.searchParams.set('error_message', 'Server configuration error: API credentials missing.');
      return Response.redirect(redirectUrl.toString(), 302);
    }

    const projectRef = getProjectRef(supabaseUrl);
    if (!projectRef) {
      console.error('Could not determine SUPABASE_PROJECT_REF from SUPABASE_URL.');
      redirectUrl.searchParams.set('youtube_auth_status', 'error');
      redirectUrl.searchParams.set('error_message', 'Server configuration error: Cannot determine project reference.');
      return Response.redirect(redirectUrl.toString(), 302);
    }

    const apiRedirectUri = `https://${projectRef}.supabase.co/functions/v1/youtube-oauth-callback`;

    const tokenRequestBody = {
      code: code,
      client_id: youtubeClientId,
      client_secret: youtubeClientSecret,
      redirect_uri: apiRedirectUri,
      grant_type: 'authorization_code',
    };

    console.log('Exchanging authorization code for tokens...');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formUrlEncode(tokenRequestBody),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Google token exchange failed:', tokenData);
      redirectUrl.searchParams.set('youtube_auth_status', 'error');
      redirectUrl.searchParams.set('error_message', `Token exchange failed: ${tokenData.error_description || tokenData.error || 'Unknown error'}`);
      return Response.redirect(redirectUrl.toString(), 302);
    }

    console.log('Tokens received from Google.');
    const refreshToken = tokenData.refresh_token;

    if (refreshToken) {
      console.log('IMPORTANT: New Refresh Token Received:', refreshToken);
      console.log('ACTION REQUIRED: Manually store this Refresh Token as the YOUTUBE_REFRESH_TOKEN secret in your Supabase project settings for the create-youtube-playlist function.');
      // Note: The refresh token is NOT sent to the client. It's logged here for manual setup.
    } else {
      console.log('No new refresh token received. This is expected if previously authorized.');
    }

    // Successfully authenticated. Redirect to frontend with success status.
    redirectUrl.searchParams.set('youtube_auth_status', 'success');
    // Optionally pass other non-sensitive info, but avoid sending tokens to client URL
    // redirectUrl.searchParams.set('message', 'YouTube account linked successfully!');
    return Response.redirect(redirectUrl.toString(), 302);

  } catch (error) {
    console.error('Error in youtube-oauth-callback function:', error);
    redirectUrl.searchParams.set('youtube_auth_status', 'error');
    redirectUrl.searchParams.set('error_message', `Internal Server Error: ${error.message}`);
    return Response.redirect(redirectUrl.toString(), 302);
  }
});

console.log('YouTube OAuth Callback Edge Function (v2) is ready to serve.');
