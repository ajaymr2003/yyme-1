import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { phone } = await req.json()
    if (!phone) {
      return new Response(JSON.stringify({ error: 'Phone number is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    const formattedPhone = `+91${phone}`
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

    const tempPassword = `TempPass_${phone}_yymee`
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      phone: formattedPhone, phone_confirm: true,
      email: `${phone}@seller.yymee.com`, email_confirm: true,
      password: tempPassword,
    })

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    const authUserId = authData.user.id

    const { error: userErr } = await supabaseAdmin.from('users').upsert([{
      user_id: authUserId, phone_number: formattedPhone,
      email: `${phone}@seller.yymee.com`, user_type: 'seller', is_active: true,
    }])

    if (userErr) {
      return new Response(JSON.stringify({ error: userErr.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    const { data: newSeller, error: sellerErr } = await supabaseAdmin
      .from('sellers').upsert([{
        user_id: authUserId, business_name: 'Pending Store', owner_name: 'Pending Owner',
        whatsapp_number: phone, shipping_state: 'Karnataka', account_status: 'pending_verification',
      }]).select('seller_id').single()

    if (sellerErr) {
      return new Response(JSON.stringify({ error: sellerErr.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    return new Response(JSON.stringify({
      success: true, userId: authUserId, sellerId: newSeller?.seller_id, tempPassword,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})
