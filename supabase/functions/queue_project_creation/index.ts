import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        const { user_id, project_type, payload } = await req.json()

        // 1. Attempt to insert into the log table.
        // The RLS policy "limit 10 per hour" will block this if limit is exceeded.
        const { error: logError } = await supabase
            .from('project_creation_log')
            .insert({ user_id, project_type })

        if (logError) {
            // If RLS blocked it, it's likely a 429 scenario (or other DB error)
            // We assume RLS violation means rate limit exceeded.
            console.error('Rate limit log error:', logError)
            return new Response(
                JSON.stringify({ error: 'Limite de criação atingido (10/hora). Tente novamente mais tarde.' }),
                {
                    status: 429,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            )
        }

        // 2. If log insertion succeeded, proceed to create the actual project.
        // We need to know which table to insert into based on project_type.
        let table = ''
        if (project_type === 'idea') table = 'ideas'
        else if (project_type === 'showroom') table = 'ideas' // Showroom projects are also in ideas table
        else if (project_type === 'roadmap') table = 'feedbacks' // Assuming 'feedbacks' is the table for roadmap

        if (!table) {
            return new Response(
                JSON.stringify({ error: 'Invalid project type' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const { data, error: createError } = await supabase
            .from(table)
            .insert(payload)
            .select()
            .single()

        if (createError) {
            console.error('Project creation error:', createError)
            // If creation fails, we might want to delete the log entry, but strict consistency isn't critical here.
            // For now, we just return the error.
            return new Response(
                JSON.stringify({ error: createError.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({ data }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Unexpected error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
