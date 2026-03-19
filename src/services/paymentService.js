import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabaseClient';
import { storageService } from './storageService';

export const paymentService = {
    /**
     * Starts the subscription flow by creating a Razorpay payment link via Supabase Edge Function
     * @param {string} planId - 'monthly' or 'annual'
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async startSubscriptionFlow(planId) {
        try {
            const userData = await storageService.getUserData();
            if (!userData) throw new Error('User not found');

            const amount = planId === 'annual' ? 2 : 1;

            // Create payment link via Supabase Edge Function
            // Note: The function name 'razorpay-create-link' is assumed based on the plan
            const { data, error } = await supabase.functions.invoke('razorpay-create-link', {
                body: {
                    userId: userData.id,
                    planId,
                    amount,
                    customerName: userData.name || 'FitFusion User',
                    customerEmail: userData.email,
                }
            });

            if (error) throw error;
            if (!data?.short_url) throw new Error('Failed to generate payment link');

            // Open the browser for checkout
            // We use WebBrowser to open the Razorpay hosted page
            const result = await WebBrowser.openBrowserAsync(data.short_url);

            // When the user returns from the browser, we should check their subscription status
            // in the background or via a deep link listener.

            return { success: true, result };
        } catch (error) {
            console.error('[paymentService] Error starting subscription:', error);
            return { success: false, error: error.message };
        }
    }
};
