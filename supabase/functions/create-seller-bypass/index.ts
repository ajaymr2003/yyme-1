import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { phone, business_name, owner_name } = await req.json()
    if (!phone) {
      return new Response(JSON.stringify({ error: 'Phone number is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    const phoneClean = phone.replace(/\D/g, '').slice(-10)
    if (phoneClean.length < 10) {
      return new Response(JSON.stringify({ error: 'Invalid 10-digit phone number' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    const formattedPhone = `+91${phoneClean}`
    const shadowEmail = `${phoneClean}@gmail.com`
    const tempPassword = `TempPass_${phoneClean}_yymee`

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Missing server env variables' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Check if user already exists in public.users
    const { data: existingUser } = await supabaseAdmin
      .from('users').select('user_id').eq('phone_number', formattedPhone).maybeSingle()

    if (existingUser) {
      const authUserId = existingUser.user_id

      // Update password & shadow email in auth.users
      await supabaseAdmin.auth.admin.updateUserById(authUserId, {
        password: tempPassword,
        email: shadowEmail,
        email_confirm: true,
        phone: formattedPhone,
        phone_confirm: true,
      })

      // Ensure public.users entry is present
      await supabaseAdmin.from('users').upsert([{
        user_id: authUserId,
        phone_number: formattedPhone,
        email: shadowEmail,
        user_type: 'seller',
        is_active: true,
      }])

      // Ensure seller profile exists
      let sellerId: string | undefined
      const { data: existingSeller } = await supabaseAdmin
        .from('sellers').select('seller_id').eq('user_id', authUserId).maybeSingle()

      if (existingSeller) {
        sellerId = existingSeller.seller_id
      } else {
        const { data: newSeller } = await supabaseAdmin.from('sellers').insert([{
          user_id: authUserId,
          business_name: business_name?.trim() || 'Pending Store',
          owner_name: owner_name?.trim() || 'Pending Owner',
          whatsapp_number: phoneClean,
          shipping_state: 'Karnataka',
          account_status: 'pending_verification',
        }]).select('seller_id').single()
        sellerId = newSeller?.seller_id
      }

      return new Response(JSON.stringify({
        success: true,
        userId: authUserId,
        sellerId,
        email: shadowEmail,
        password: tempPassword,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    // New user creation in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      phone: formattedPhone,
      phone_confirm: true,
      email: shadowEmail,
      email_confirm: true,
      password: tempPassword,
    })

    let authUserId: string
    if (authError) {
      // If user exists in auth, retrieve and update
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers()
      const foundUser = listData?.users?.find(u => u.email === shadowEmail || u.phone === formattedPhone)
      if (foundUser) {
        authUserId = foundUser.id
        await supabaseAdmin.auth.admin.updateUserById(authUserId, {
          password: tempPassword,
          email: shadowEmail,
          email_confirm: true,
          phone: formattedPhone,
          phone_confirm: true,
        })
      } else {
        return new Response(JSON.stringify({ error: authError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
      }
    } else {
      authUserId = authData.user.id
    }

    // Upsert public.users
    const { error: userErr } = await supabaseAdmin.from('users').upsert([{
      user_id: authUserId,
      phone_number: formattedPhone,
      email: shadowEmail,
      user_type: 'seller',
      is_active: true,
    }])

    if (userErr) {
      return new Response(JSON.stringify({ error: userErr.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    // Upsert public.sellers
    const { data: newSeller, error: sellerErr } = await supabaseAdmin
      .from('sellers').upsert([{
        user_id: authUserId,
        business_name: business_name?.trim() || 'Pending Store',
        owner_name: owner_name?.trim() || 'Pending Owner',
        whatsapp_number: phoneClean,
        shipping_state: 'Karnataka',
        account_status: 'pending_verification',
      }], { onConflict: 'user_id' }).select('seller_id').single()

    if (sellerErr) {
      return new Response(JSON.stringify({ error: sellerErr.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    return new Response(JSON.stringify({
      success: true,
      userId: authUserId,
      sellerId: newSeller?.seller_id,
      email: shadowEmail,
      password: tempPassword,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})
