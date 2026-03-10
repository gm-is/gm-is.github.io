/**
 * Cloudflare Worker: OpenRouter chat proxy + D1 logging for gmis.me
 *
 * Routes:
 *   POST /       → chat proxy (OpenRouter API, key injected server-side)
 *   POST /rate   → store GIF viewer rating in D1
 *
 * Deploy:  wrangler deploy
 * Secret:  wrangler secret put OPENROUTER_API_KEY
 * Logs:    wrangler d1 execute gmis-chat-logs --remote --command "SELECT * FROM chats ORDER BY created_at DESC LIMIT 20"
 * Ratings: wrangler d1 execute gmis-chat-logs --remote --command "SELECT row_id, dimension, value, COUNT(*) as n FROM gif_ratings GROUP BY row_id, dimension, value ORDER BY row_id, dimension"
 */

const ALLOWED_ORIGINS = [
  'https://gmis.me',
  'http://localhost',
  'http://127.0.0.1',
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.some(o => origin && origin.startsWith(o))
    ? origin : 'https://gmis.me';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // ── Route: POST /rate ──────────────────────────────────────────────────
    if (url.pathname === '/rate') {
      try {
        const { row_id, dimension, value } = await request.json();
        if (env.DB && row_id && dimension) {
          await env.DB.prepare(
            'INSERT INTO gif_ratings (row_id, dimension, value, country) VALUES (?, ?, ?, ?)'
          ).bind(row_id, dimension, String(value), request.cf?.country || '').run();
        }
        return new Response('ok', { status: 200, headers: corsHeaders(origin) });
      } catch (e) {
        return new Response('Error: ' + e.message, { status: 400, headers: corsHeaders(origin) });
      }
    }

    // ── Route: POST / (chat proxy) ─────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('Bad Request: invalid JSON', { status: 400 });
    }

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

    const responseText = await upstream.text();
    const model = body.model || '';
    const userMessage = body.messages?.findLast(m => m.role === 'user')?.content || '';
    const country = request.cf?.country || '';

    let assistantMessage = '';
    if (body.stream) {
      for (const line of responseText.split('\n')) {
        if (!line.startsWith('data: ') || line.includes('[DONE]')) continue;
        try { assistantMessage += JSON.parse(line.slice(6)).choices?.[0]?.delta?.content || ''; } catch {}
      }
    } else {
      try { assistantMessage = JSON.parse(responseText).choices?.[0]?.message?.content || ''; } catch {}
    }

    if (env.DB && userMessage) {
      env.DB.prepare(
        'INSERT INTO chats (model, user_message, assistant_message, country) VALUES (?, ?, ?, ?)'
      ).bind(model, userMessage, assistantMessage, country).run().catch(() => {});
    }

    return new Response(responseText, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') || 'text/event-stream',
        'Cache-Control': 'no-cache',
        ...corsHeaders(origin),
      },
    });
  },
};
