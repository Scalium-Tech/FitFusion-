import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';

const PLAN_KEY = '@fitfusion_ai_plan';
const USER_DATA_KEY = '@fitfusion_user_data';
const ONBOARDED_KEY = '@fitfusion_onboarded';

const _getUserKey = async (baseKey, userId = null) => {
    try {
        if (userId) return `${baseKey}_${userId}`;
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            return `${baseKey}_${session.user.id}`;
        }
        return baseKey; // Fallback for anonymous or initial state
    } catch (e) {
        return baseKey;
    }
};

export const storageService = {
    // Helper to get active session or sign in anonymously
    getOrCreateUser: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) return session.user;

        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        return data.user;
    },

    savePlan: async (plan) => {
        try {
            // Save locally with user-specific key
            const userKey = await _getUserKey(PLAN_KEY);
            await AsyncStorage.setItem(userKey, JSON.stringify(plan));

            // Sync to Supabase
            const user = await storageService.getOrCreateUser();
            if (user) {
                await supabase.from('fitness_plans').insert({
                    user_id: user.id,
                    plan_data: plan
                });
            }
        } catch (error) {
            console.error('Error saving plan:', error);
        }
    },

    getPlan: async () => {
        try {
            // Try Supabase first if online
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data, error } = await supabase
                    .from('fitness_plans')
                    .select('plan_data')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (data) return data.plan_data;
            }

            // Fallback to local with user-specific key
            const userKey = await _getUserKey(PLAN_KEY);
            const plan = await AsyncStorage.getItem(userKey);
            return plan ? JSON.parse(plan) : null;
        } catch (error) {
            console.error('Error getting plan:', error);
            const userKey = await _getUserKey(PLAN_KEY);
            const plan = await AsyncStorage.getItem(userKey);
            return plan ? JSON.parse(plan) : null;
        }
    },

    saveUserData: async (userData) => {
        try {
            // Save locally with user-specific key
            const userKey = await _getUserKey(USER_DATA_KEY);
            await AsyncStorage.setItem(userKey, JSON.stringify(userData));

            // Sync to Supabase (Upsert)
            const user = await storageService.getOrCreateUser();
            if (user) {
                const { error } = await supabase
                    .from('user_profiles')
                    .upsert({
                        id: user.id,
                        name: userData.name,
                        goal: userData.goal,
                        gender: userData.gender,
                        age: parseInt(userData.age),
                        height: parseFloat(userData.height),
                        height_unit: userData.heightUnit,
                        weight: parseFloat(userData.weight),
                        weight_unit: userData.weightUnit,
                        target_weight: parseFloat(userData.targetWeight),
                        target_weight_unit: userData.targetWeightUnit,
                        focus_areas: userData.focusAreas,
                        health_conditions: userData.healthConditions,
                        activity_level: userData.activityLevel,
                        experience: userData.experience,
                        training_days: parseInt(userData.trainingDays),
                        diet_type: userData.dietType,
                        diet_budget: parseFloat(userData.dietBudget),
                        region: userData.region,
                        allergies: userData.allergies,
                        workout_location: userData.workoutLocation,
                        available_equipment: userData.equipment,
                        preferred_duration: parseInt(userData.preferredDuration),
                        is_subscribed: userData.is_subscribed || false,
                        subscription_tier: userData.subscription_tier || 'free',
                        updated_at: new Date().toISOString()
                    });
                if (error) console.error('Supabase Upsert Error:', error);
            }
        } catch (error) {
            console.error('Error saving user data:', error);
        }
    },

    setIsOnboarded: async (status) => {
        try {
            const userKey = await _getUserKey(ONBOARDED_KEY);
            await AsyncStorage.setItem(userKey, JSON.stringify(status));
        } catch (error) {
            console.error('Error setting onboarded state:', error);
        }
    },

    getIsOnboarded: async () => {
        try {
            const userKey = await _getUserKey(ONBOARDED_KEY);
            const onboarded = await AsyncStorage.getItem(userKey);
            return onboarded ? JSON.parse(onboarded) : false;
        } catch (error) {
            console.error('Error getting onboarded state:', error);
            return false;
        }
    },

    getUserData: async () => {
        try {
            // Try Supabase
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data, error } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (data) {
                    // Map back to local format if needed
                    return {
                        ...data,
                        heightUnit: data.height_unit,
                        weightUnit: data.weight_unit,
                        targetWeight: data.target_weight,
                        targetWeightUnit: data.target_weight_unit,
                        focusAreas: data.focus_areas,
                        healthConditions: data.health_conditions,
                        trainingDays: data.training_days,
                        dietType: data.diet_type,
                        dietBudget: data.diet_budget,
                        region: data.region,
                        workoutLocation: data.workout_location,
                        equipment: data.available_equipment,
                        preferred_duration: data.preferred_duration,
                        is_subscribed: data.is_subscribed,
                        subscription_tier: data.subscription_tier
                    };
                }
            }

            // Fallback to local with user-specific key
            const userKey = await _getUserKey(USER_DATA_KEY);
            const data = await AsyncStorage.getItem(userKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting user data:', error);
            const userKey = await _getUserKey(USER_DATA_KEY);
            const data = await AsyncStorage.getItem(userKey);
            return data ? JSON.parse(data) : null;
        }
    },

    saveMealLog: async (mealData) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('meal_logs')
                .insert([{
                    user_id: session.user.id,
                    meal_name: mealData.name,
                    calories: mealData.calories,
                    protein: mealData.protein,
                    carbs: mealData.carbs,
                    fats: mealData.fats,
                    confidence: mealData.confidence,
                    description: mealData.description,
                    image_url: mealData.image_url || null,
                    logged_date: storageService.getLocalDateString()
                }])
                .select();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error saving meal log:', error);
            throw error;
        }
    },

    getTodaysNutrition: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return { calories: 0, protein: 0, carbs: 0, fats: 0 };

            const dateStr = storageService.getLocalDateString(new Date());

            // 1. Fetch AI Scanned meals
            const { data: scavengedLogs, error: logError } = await supabase
                .from('meal_logs')
                .select('calories, protein, carbs, fats')
                .eq('user_id', session.user.id)
                .eq('logged_date', dateStr);

            if (logError) throw logError;

            // 2. Fetch Ticked Diet Plan meals
            const { data: completions, error: compError } = await supabase
                .from('meal_completions')
                .select('meal_type')
                .eq('user_id', session.user.id)
                .eq('date', dateStr);

            if (compError) throw compError;

            const totals = scavengedLogs.reduce((acc, curr) => ({
                calories: acc.calories + (curr.calories || 0),
                protein: acc.protein + (curr.protein || 0),
                carbs: acc.carbs + (curr.carbs || 0),
                fats: acc.fats + (curr.fats || 0)
            }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

            // 3. Add nutritional values from ticked meals if they aren't already scanned
            if (completions?.length > 0) {
                const plan = await storageService.getPlan();
                const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                const dayPlan = plan?.nutritionPlan?.weeklyPlan?.find(d => d.day === dayName);

                if (dayPlan) {
                    completions.forEach(comp => {
                        const plannedMeal = dayPlan.meals.find(m => m.type === comp.meal_type);
                        if (plannedMeal) {
                            totals.calories += parseInt(plannedMeal.calories) || 0;
                            totals.protein += parseFloat(plannedMeal.macros?.p) || 0;
                            totals.carbs += parseFloat(plannedMeal.macros?.c) || 0;
                            totals.fats += parseFloat(plannedMeal.macros?.f) || 0;
                        }
                    });
                }
            }

            return totals;
        } catch (error) {
            console.error('Error getting today nutrition:', error);
            return { calories: 0, protein: 0, carbs: 0, fats: 0 };
        }
    },

    clearAll: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const userId = session.user.id;
                await AsyncStorage.multiRemove([
                    `${PLAN_KEY}_${userId}`,
                    `${USER_DATA_KEY}_${userId}`,
                    `${ONBOARDED_KEY}_${userId}`
                ]);
            }
            // Also clear legacy non-prefixed keys just in case
            await AsyncStorage.multiRemove([PLAN_KEY, USER_DATA_KEY, ONBOARDED_KEY]);
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Error clearing storage:', error);
        }
    },

    logMeal: async (mealData) => {
        try {
            const user = await storageService.getOrCreateUser();
            if (user) {
                const { error } = await supabase
                    .from('meal_logs')
                    .insert({
                        user_id: user.id,
                        meal_name: mealData.name,
                        calories: mealData.calories,
                        protein: mealData.protein,
                        carbs: mealData.carbs,
                        fats: mealData.fats,
                        image_url: mealData.imageUri, // We could upload this to storage later
                        logged_date: storageService.getLocalDateString()
                    });
                if (error) throw error;
                return true;
            }
        } catch (error) {
            console.error('Error logging meal:', error);
            throw error;
        }
    },

    getDailyLogs: async (date = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0')) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data, error } = await supabase
                    .from('meal_logs')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .eq('logged_date', date);

                if (error) throw error;
                return data || [];
            }
            return [];
        } catch (error) {
            console.error('Error getting daily logs:', error);
            return [];
        }
    },

    saveChatMessage: async (message) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const { error } = await supabase
                .from('chat_messages')
                .insert([{
                    user_id: session.user.id,
                    role: message.role,
                    content: message.content
                }]);

            if (error) throw error;
        } catch (error) {
            console.error('Error saving chat message:', error);
        }
    },

    getChatHistory: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return [];

            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting chat history:', error);
            return [];
        }
    },

    // Standardized local date string (YYYY-MM-DD)
    getLocalDateString: (date = new Date()) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    toggleMealCompletion: async (date, mealType) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return null;

            // Check if it already exists
            const { data: existing } = await supabase
                .from('meal_completions')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('date', date)
                .eq('meal_type', mealType)
                .single();

            if (existing) {
                // Remove it (Untick)
                await supabase
                    .from('meal_completions')
                    .delete()
                    .eq('id', existing.id);
                return false;
            } else {
                // Add it (Tick)
                await supabase
                    .from('meal_completions')
                    .insert({
                        user_id: session.user.id,
                        date,
                        meal_type: mealType,
                        completed: true
                    });
                return true;
            }
        } catch (error) {
            console.error('Error toggling meal completion:', error);
            return null;
        }
    },

    getMealCompletions: async (date) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return [];

            const { data, error } = await supabase
                .from('meal_completions')
                .select('meal_type')
                .eq('user_id', session.user.id)
                .eq('date', date);

            if (error) throw error;
            return data.map(item => item.meal_type);
        } catch (error) {
            console.error('Error getting meal completions:', error);
            return [];
        }
    },

    getDietStreak: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return 0;

            // Get all unique dates with completions, ordered by date descending
            const { data, error } = await supabase
                .from('meal_completions')
                .select('date')
                .eq('user_id', session.user.id)
                .order('date', { ascending: false });

            if (error) throw error;
            if (!data || data.length === 0) return 0;

            // Extract unique dates as YYYY-MM-DD
            const uniqueDates = [...new Set(data.map(item => item.date))];

            let streak = 0;
            let checkDate = new Date();
            checkDate.setHours(0, 0, 0, 0);

            // Check if they completed anything today or yesterday to continue streak
            let dateStr = storageService.getLocalDateString(checkDate);

            // If they haven't done anything today, check if they did something yesterday
            if (!uniqueDates.includes(dateStr)) {
                checkDate.setDate(checkDate.getDate() - 1);
                dateStr = storageService.getLocalDateString(checkDate);
                if (!uniqueDates.includes(dateStr)) return 0; // Streak broken
            }

            // Count backwards
            while (uniqueDates.includes(dateStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
                dateStr = storageService.getLocalDateString(checkDate);
            }

            return streak;
        } catch (error) {
            console.error('Error getting diet streak:', error);
            return 0;
        }
    },

    async getWorkoutStreak() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return 0;

            const { data, error } = await supabase
                .from('workout_completions')
                .select('date')
                .eq('user_id', session.user.id)
                .order('date', { ascending: false });

            if (error) throw error;
            if (!data || data.length === 0) return 0;

            const uniqueDates = data.map(item => item.date);
            let streak = 0;
            let checkDate = new Date();
            checkDate.setHours(0, 0, 0, 0);

            let dateStr = storageService.getLocalDateString(checkDate);
            if (!uniqueDates.includes(dateStr)) {
                checkDate.setDate(checkDate.getDate() - 1);
                dateStr = storageService.getLocalDateString(checkDate);
                if (!uniqueDates.includes(dateStr)) return 0;
            }

            while (uniqueDates.includes(dateStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
                dateStr = storageService.getLocalDateString(checkDate);
            }
            return streak;
        } catch (error) {
            console.error('Error getting workout streak:', error);
            return 0;
        }
    },

    async getBestStreak() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return 0;

            const [workoutRes, dietRes] = await Promise.all([
                supabase.from('workout_completions').select('date').eq('user_id', session.user.id),
                supabase.from('meal_completions').select('date').eq('user_id', session.user.id)
            ]);

            const calculateMax = (data) => {
                if (!data || data.length === 0) return 0;
                const dates = [...new Set(data.map(item => item.date))].sort();
                if (dates.length === 0) return 0;

                let max = 1;
                let current = 1;
                for (let i = 1; i < dates.length; i++) {
                    const prevDate = new Date(dates[i - 1]);
                    const currDate = new Date(dates[i]);
                    const diffTime = Math.abs(currDate - prevDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays === 1) {
                        current++;
                        max = Math.max(max, current);
                    } else if (diffDays > 1) {
                        current = 1;
                    }
                }
                return max;
            };

            const bestWorkout = calculateMax(workoutRes.data);
            const bestDiet = calculateMax(dietRes.data);
            return Math.max(bestWorkout, bestDiet);
        } catch (error) {
            console.error('Error getting best streak:', error);
            return 0;
        }
    },

    async toggleWorkoutCompletion(date) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return null;

            const { data: existing } = await supabase
                .from('workout_completions')
                .select('id')
                .eq('user_id', session.user.id)
                .eq('date', date)
                .single();

            if (existing) {
                await supabase.from('workout_completions').delete().eq('id', existing.id);
                return false;
            } else {
                await supabase.from('workout_completions').insert({ user_id: session.user.id, date });
                return true;
            }
        } catch (error) {
            console.error('Error toggling workout completion:', error);
            return null;
        }
    },

    async getWorkoutCompletion(date) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return false;

            const { data } = await supabase
                .from('workout_completions')
                .select('id')
                .eq('user_id', session.user.id)
                .eq('date', date)
                .single();

            return !!data;
        } catch (error) {
            console.error('Error getting workout completion:', error);
            return false;
        }
    },

    async getTodaysBurnedCalories() {
        try {
            const dateStr = storageService.getLocalDateString(new Date());
            const isCompleted = await storageService.getWorkoutCompletion(dateStr);
            if (!isCompleted) return 0;

            const plan = await storageService.getPlan();
            if (!plan?.workoutPlan?.days) return 300; // Fallback estimate

            const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
            const todayWorkout = plan.workoutPlan.days.find(d => d.day === dayName);

            return todayWorkout?.caloriesBurned || 300; // Plan value or fallback
        } catch (error) {
            console.error('Error getting burned calories:', error);
            return 0;
        }
    },

    async getWeeklyStats() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return null;

            const days = [];
            const workoutCompletions = [];
            const dietCompletions = [];
            const caloriesIntake = [];
            const caloriesBurned = [];

            // Get last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = storageService.getLocalDateString(date);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

                days.push(dayName);

                // Check workout
                const { data: workout } = await supabase
                    .from('workout_completions')
                    .select('id')
                    .eq('user_id', session.user.id)
                    .eq('date', dateStr)
                    .single();
                workoutCompletions.push(workout ? 100 : 0);

                // Check diet (consider day completed if at least 3 meals logged or completion marked)
                const { data: meals } = await supabase
                    .from('meal_completions')
                    .select('meal_type')
                    .eq('user_id', session.user.id)
                    .eq('date', dateStr);

                const { data: mealLogs } = await supabase
                    .from('meal_logs')
                    .select('calories')
                    .eq('user_id', session.user.id)
                    .eq('logged_date', dateStr);

                const dietScore = (meals?.length >= 3 || mealLogs?.length >= 3) ? 100 : (meals?.length || 0) * 33;
                dietCompletions.push(Math.min(dietScore, 100));

                // Calculate calories intake
                let totalDailyCal = 0;

                // 1. Add calories from AI-Scanned meal logs
                const scannedCal = mealLogs?.reduce((sum, m) => sum + (m.calories || 0), 0) || 0;
                totalDailyCal += scannedCal;

                // 2. Add calories from manually ticked planned meals
                if (meals?.length > 0) {
                    const plan = await storageService.getPlan();
                    const fullDayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                    const dayPlan = plan?.nutritionPlan?.weeklyPlan?.find(d => d.day === fullDayName);

                    if (dayPlan) {
                        meals.forEach(comp => {
                            const plannedMeal = dayPlan.meals.find(m => m.type === comp.meal_type);
                            if (plannedMeal) {
                                // Only add planned calories if they wasn't likely already accounted for by a scan
                                // (If scannedCal is 0, we definitely add. If scannedCal > 0, we still add to show progress on "tick")
                                totalDailyCal += parseInt(plannedMeal.calories) || 0;
                            }
                        });
                    }
                }

                caloriesIntake.push(totalDailyCal);

                // Burned calories (only if workout completed)
                if (workout) {
                    const plan = await storageService.getPlan();
                    const fullDayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                    const todayWorkout = plan?.workoutPlan?.days?.find(d => d.day === fullDayName);
                    caloriesBurned.push(todayWorkout?.caloriesBurned || 300);
                } else {
                    caloriesBurned.push(0);
                }
            }

            return {
                labels: days,
                workoutData: workoutCompletions,
                dietData: dietCompletions,
                caloriesIntake,
                caloriesBurned
            };
        } catch (error) {
            console.error('Error getting weekly stats:', error);
            return null;
        }
    },

    saveFeedback: async (feedbackData) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('user_feedback')
                .insert([{
                    user_id: session.user.id,
                    rating: feedbackData.rating,
                    category: feedbackData.category,
                    areas: feedbackData.areas,
                    comment: feedbackData.feedback
                }]);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error saving feedback:', error);
            throw error;
        }
    },

    async saveSupportTicket(ticketData) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No authenticated user');

            const { data, error } = await supabase
                .from('support_tickets')
                .insert([{
                    user_id: user.id,
                    ...ticketData,
                    status: 'open',
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error saving support ticket:', error);
            throw error;
        }
    },

    async getWorkoutReminder() {
        try {
            const data = await AsyncStorage.getItem('workout_reminder');
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting workout reminder:', error);
            return null;
        }
    },

    async saveWorkoutReminder(settings) {
        try {
            await AsyncStorage.setItem('workout_reminder', JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving workout reminder:', error);
            throw error;
        }
    }
};
