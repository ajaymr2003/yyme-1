import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { phone, name, email } = await req.json()
    if (!phone || !name || !email) {
      return new Response(JSON.stringify({ error: 'Phone, name, and email are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    const formattedPhone = `+91${phone.replace(/\D/g, '').slice(-10)}`
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Missing server env variables' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { data: existingUser } = await supabaseAdmin
      .from('users').select('user_id').eq('phone_number', formattedPhone).maybeSingle()

    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Account exists. Please log in.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    const tempPassword = `TempPass_${phone.replace(/\D/g, '').slice(-10)}_yymee`
    const shadowEmail = `${phone.replace(/\D/g, '').slice(-10)}@buyer.yymee.com`

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      phone: formattedPhone, phone_confirm: true,
      email: shadowEmail, email_confirm: true, password: tempPassword,
    })

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    const authUserId = authData.user.id

    const { error: userErr } = await supabaseAdmin.from('users').insert([{
      user_id: authUserId, phone_number: formattedPhone,
      email: email, user_type: 'buyer', is_active: true,
    }])

    if (userErr) {
      await supabaseAdmin.auth.admin.deleteUser(authUserId)
      return new Response(JSON.stringify({ error: userErr.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    const { error: buyerErr } = await supabaseAdmin.from('buyers').insert([{
      user_id: authUserId, full_name: name,
    }])

    if (buyerErr) {
      await supabaseAdmin.from('users').delete().eq('user_id', authUserId)
      await supabaseAdmin.auth.admin.deleteUser(authUserId)
      return new Response(JSON.stringify({ error: buyerErr.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    return new Response(JSON.stringify({
      success: true, userId: authUserId, email: shadowEmail, password: tempPassword,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})
