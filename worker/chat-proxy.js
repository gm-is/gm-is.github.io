/**
 * Cloudflare Worker — OpenRouter Chat Proxy for gmis.me
 *
 * Deployment:
 *   1. Create a Worker at dash.cloudflare.com
 *   2. Paste this script
 *   3. Add environment variable: OPENROUTER_API_KEY = sk-or-v1-...
 *   4. (Optional) Add a custom route or use the *.workers.dev subdomain
 *   5. Update WORKER_URL in index.html to your worker URL
 *
 * The worker receives chat requests from the frontend, injects the API key,
 * and proxies the streaming response from OpenRouter. The key never touches
 * the browser.
 */

const ALLOWED_ORIGINS = ['https://gmis.me', 'http://localhost', 'http://127.0.0.1'];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.some(o => origin?.startsWith(o));
  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const headers = corsHeaders(origin);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers });
    }

    try {
      const body = await request.json();

      // Forward to OpenRouter with the secret API key
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

      // Stream the response back to the client
      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          ...headers,
          'Content-Type': upstream.headers.get('Content-Type') || 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Proxy error' }), {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }
  },
};
