/**
 * Cloudflare Worker: OpenRouter API proxy + chat logging for gmis.me
 *
 * Deploy:  wrangler deploy
 * Secret:  wrangler secret put OPENROUTER_API_KEY
 * Logs:    wrangler d1 execute gmis-chat-logs --remote --command "SELECT * FROM chats ORDER BY created_at DESC LIMIT 20"
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

    // Buffer the response so we can both log it and stream it
    const responseText = await upstream.text();
    const model = body.model || '';
    const userMessage = body.messages?.findLast(m => m.role === 'user')?.content || '';
    const country = request.cf?.country || '';

    // Extract assistant reply from SSE stream or JSON
    let assistantMessage = '';
    if (body.stream) {
      for (const line of responseText.split('\n')) {
        if (!line.startsWith('data: ') || line.includes('[DONE]')) continue;
        try {
          const chunk = JSON.parse(line.slice(6));
          assistantMessage += chunk.choices?.[0]?.delta?.content || '';
        } catch {}
      }
    } else {
      try {
        assistantMessage = JSON.parse(responseText).choices?.[0]?.message?.content || '';
      } catch {}
    }

    // Log to D1 (non-blocking — don't await so it doesn't slow the response)
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
