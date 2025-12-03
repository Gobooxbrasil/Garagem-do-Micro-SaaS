import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHash } from 'https://deno.land/std@0.168.0/node/crypto.ts';

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;

serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        );

        const {
            data: { user },
            error: authError,
        } = await supabaseClient.auth.getUser();

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const telegramData = await req.json();

        // Validate Telegram Login Widget data
        // https://core.telegram.org/widgets/login#checking-authorization
        const { hash, ...data } = telegramData;

        const dataCheckString = Object.keys(data)
            .sort()
            .map(key => `${key}=${data[key]}`)
            .join('\n');

        const secretKey = createHash('sha256')
            .update(TELEGRAM_BOT_TOKEN)
            .digest();

        const expectedHash = createHash('hmac-sha256')
            .update(dataCheckString, { key: secretKey })
            .digest('hex');

        if (expectedHash !== hash) {
            return new Response(
                JSON.stringify({ error: 'Invalid Telegram data' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Update profile with Telegram info
        const { error: updateError } = await supabaseClient
            .from('profiles')
            .update({
                telegram_user_id: data.id,
                telegram_username: data.username || null,
            })
            .eq('id', user.id);

        if (updateError) {
            return new Response(
                JSON.stringify({ error: 'Failed to save Telegram data', details: updateError.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Immediately check membership after connecting
        const checkUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/telegram-check-membership`;
        const checkResponse = await fetch(checkUrl, {
            method: 'POST',
            headers: {
                'Authorization': req.headers.get('Authorization')!,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ telegram_user_id: data.id }),
        });

        const checkResult = await checkResponse.json();

        return new Response(
            JSON.stringify({
                success: true,
                telegram_user_id: data.id,
                telegram_username: data.username,
                membership_check: checkResult
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
