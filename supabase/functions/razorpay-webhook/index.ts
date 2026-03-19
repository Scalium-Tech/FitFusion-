// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RAZORPAY_WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req: Request) => {
    try {
        const signature = req.headers.get('x-razorpay-signature')
        const body = await req.text()

        // In a production environment, you should verify the signature here
        // using hmac-sha256 with RAZORPAY_WEBHOOK_SECRET

        const payload = JSON.parse(body)

        // We only care about successful payments
        if (payload.event === 'payment_link.paid') {
            const { payment_link } = payload.payload
            const { userId, planId } = payment_link.entity.notes

            if (!userId || !planId) {
                throw new Error('Missing metadata in payment link notes')
            }

            const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

            const { error } = await supabase
                .from('user_profiles')
                .update({
                    is_subscribed: true,
                    subscription_tier: planId
                })
                .eq('id', userId)

            if (error) throw error

            console.log(`[Webhook] Successfully updated subscription for user ${userId} to ${planId}`)
        }

        return new Response(JSON.stringify({ status: 'ok' }), {
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (error: any) {
        console.error('[Webhook Error]', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        })
    }
})
