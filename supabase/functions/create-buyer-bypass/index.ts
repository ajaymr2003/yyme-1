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
    const buyerName = name?.trim() || 'Buyer'
    const contactEmail = email?.trim() || shadowEmail

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

      // Update password and shadow email in auth.users
      await supabaseAdmin.auth.admin.updateUserById(authUserId, {
        password: tempPassword,
        email: shadowEmail,
        email_confirm: true,
        phone: formattedPhone,
        phone_confirm: true,
      })

      // Ensure public.users entry is present & active
      await supabaseAdmin.from('users').upsert([{
        user_id: authUserId,
        phone_number: formattedPhone,
        email: contactEmail,
        user_type: 'buyer',
        is_active: true,
      }])

      // Ensure buyer profile exists
      const { data: existingBuyer } = await supabaseAdmin
        .from('buyers').select('buyer_id').eq('user_id', authUserId).maybeSingle()

      if (!existingBuyer) {
        await supabaseAdmin.from('buyers').insert([{
          user_id: authUserId,
          full_name: buyerName,
        }])
      }

      return new Response(JSON.stringify({
        success: true,
        userId: authUserId,
        email: shadowEmail,
        password: tempPassword,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    // New user creation
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      phone: formattedPhone,
      phone_confirm: true,
      email: shadowEmail,
      email_confirm: true,
      password: tempPassword,
    })

    let authUserId: string
    if (authError) {
      // If user exists in auth but not in public.users, retrieve user
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
      email: contactEmail,
      user_type: 'buyer',
      is_active: true,
    }])

    if (userErr) {
      return new Response(JSON.stringify({ error: userErr.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    // Upsert public.buyers
    const { error: buyerErr } = await supabaseAdmin.from('buyers').upsert([{
      user_id: authUserId,
      full_name: buyerName,
    }])

    if (buyerErr) {
      return new Response(JSON.stringify({ error: buyerErr.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    return new Response(JSON.stringify({
      success: true,
      userId: authUserId,
      email: shadowEmail,
      password: tempPassword,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})
