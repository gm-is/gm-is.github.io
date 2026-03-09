/**
 * Cloudflare Worker: OpenRouter API proxy for gmis.me chat
 *
 * Deploy:
 *   wrangler deploy
 *   wrangler secret put OPENROUTER_API_KEY
 *
 * The API key is stored as a Worker secret — it never reaches the browser.
 */

const ALLOWED_ORIGINS = [
  'https://gmis.me',
  'http://localhost',
  'http://127.0.0.1',
];

function corsHeaders(origin) {
  const allowedOrigin = ALLOWED_ORIGINS.some(o => origin && origin.startsWith(o))
    ? origin
    : 'https://gmis.me';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('Bad Request: invalid JSON', { status: 400 });
    }

    // Forward to OpenRouter with the secret key injected server-side
    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://gmis.me',
        'X-Title': 'Ming Gu Academic Website',
      },
      body: JSON.stringify(body),
    });

    // Stream the response back to the browser
    const responseHeaders = {
      'Content-Type': upstream.headers.get('Content-Type') || 'text/event-stream',
      'Cache-Control': 'no-cache',
      ...corsHeaders(origin),
    };

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  },
};
