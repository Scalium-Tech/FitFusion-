// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')

serve(async (req: Request) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            }
        })
    }

    try {
        const { userId, planId, amount, customerName, customerEmail } = await req.json()

        if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
            return new Response(JSON.stringify({ error: 'Razorpay keys not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            })
        }

        const response = await fetch('https://api.razorpay.com/v1/payment_links', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)
            },
            body: JSON.stringify({
                amount: amount * 100, // Amount in paisa
                currency: 'INR',
                accept_partial: false,
                description: `FitFusion ${planId} Subscription`,
                customer: {
                    name: customerName,
                    email: customerEmail,
                },
                notify: {
                    sms: false,
                    email: true
                },
                reminder_enable: true,
                notes: {
                    userId: userId,
                    planId: planId
                },
                // This should match your app's deep link scheme
                callback_url: 'fitfusion://payment-complete',
                callback_method: 'get'
            })
        })

        const data = await response.json()
        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        })
    }
})
