import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are the BodyOS Coach — a knowledgeable, motivating fitness and posture coach integrated into the BodyOS app.

Your personality:
- Encouraging but honest — you celebrate progress and gently correct form issues
- Data-driven — you reference the user's actual posture scores, workout history, streak, and goals when available
- Concise — keep responses focused and actionable (2-4 paragraphs max)
- Safety-first — always recommend consulting a professional for pain/injury concerns

Your capabilities:
- Posture analysis guidance based on body scan results
- Workout programming and exercise selection
- Mobility and stretching routines
- Form cues and coaching tips
- Progress tracking motivation

When user context is provided, reference their specific data naturally in your responses.
Do not use markdown formatting — respond in plain text since this is a mobile chat interface.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { conversation_id, message, user_context } = await req.json();

    if (typeof conversation_id !== 'string' || typeof message !== 'string' || !message.trim() || message.length > 8000) {
      return new Response(
        JSON.stringify({ error: 'conversation_id and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // The service client bypasses RLS: establish the caller and ownership first.
    const token = req.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const { data: owned, error: ownershipError } = await supabase.from('ai_conversations').select('id').eq('id', conversation_id).eq('user_id', user.id).maybeSingle();
    if (ownershipError || !owned) return new Response(JSON.stringify({ error: 'Conversation not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Insert user message
    const { error: userMsgError } = await supabase.from('ai_messages').insert({
      conversation_id,
      role: 'user',
      content: message,
    });
    if (userMsgError) throw userMsgError;

    // Fetch conversation history (last 20 messages for context window)
    const { data: history, error: historyError } = await supabase
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (historyError) throw historyError;

    // Build messages array for OpenAI
    const systemContent = user_context
      ? `${SYSTEM_PROMPT}\n\nCurrent user context:\n${user_context}`
      : SYSTEM_PROMPT;

    const openaiMessages = [
      { role: 'system', content: systemContent },
      ...(history ?? []).reverse().map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // Call OpenAI
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: openaiMessages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!openaiRes.ok) {
      const errBody = await openaiRes.text();
      throw new Error(`OpenAI API error: ${openaiRes.status} ${errBody}`);
    }

    const openaiData = await openaiRes.json();
    const assistantContent = openaiData.choices?.[0]?.message?.content ?? 'Sorry, I could not generate a response.';

    // Insert assistant message
    const { data: assistantRow, error: assistantMsgError } = await supabase
      .from('ai_messages')
      .insert({
        conversation_id,
        role: 'assistant',
        content: assistantContent,
      })
      .select('id, role, content, created_at')
      .single();
    if (assistantMsgError) throw assistantMsgError;

    // Update conversation updated_at
    await supabase
      .from('ai_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversation_id);

    return new Response(
      JSON.stringify({
        id: assistantRow.id,
        role: assistantRow.role,
        content: assistantRow.content,
        createdAt: assistantRow.created_at,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('chat-coach request failed');
    return new Response(
      JSON.stringify({ error: 'The coaching request could not be completed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
