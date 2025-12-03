import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const TELEGRAM_GROUP_ID = '-1003324547225';

serve(async (req) => {
    // CORS headers
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

        // Get authenticated user
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

        const { telegram_user_id } = await req.json();

        if (!telegram_user_id) {
            return new Response(
                JSON.stringify({ error: 'telegram_user_id is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Check if user is in the Telegram group
        const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMember?chat_id=${TELEGRAM_GROUP_ID}&user_id=${telegram_user_id}`;

        const telegramResponse = await fetch(telegramApiUrl);
        const telegramData = await telegramResponse.json();

        if (!telegramData.ok) {
            return new Response(
                JSON.stringify({
                    allowed: false,
                    error: 'Failed to check Telegram membership',
                    details: telegramData.description
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const memberStatus = telegramData.result.status;
        const isInGroup = ['member', 'administrator', 'creator'].includes(memberStatus);

        // Update user profile
        const { error: updateError } = await supabaseClient
            .from('profiles')
            .update({
                is_in_telegram_group: isInGroup,
                last_telegram_check_at: new Date().toISOString(),
                telegram_validated_at: isInGroup ? new Date().toISOString() : null,
            })
            .eq('id', user.id);

        if (updateError) {
            return new Response(
                JSON.stringify({ error: 'Failed to update profile', details: updateError.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({
                allowed: isInGroup,
                status: memberStatus,
                message: isInGroup ? 'Access granted' : 'User is not a member of the group'
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
