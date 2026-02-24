import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';

const PLAN_KEY = '@fitfusion_ai_plan';
const USER_DATA_KEY = '@fitfusion_user_data';
const ONBOARDED_KEY = '@fitfusion_onboarded';

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
            // Save locally first
            await AsyncStorage.setItem(PLAN_KEY, JSON.stringify(plan));

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

            // Fallback to local
            const plan = await AsyncStorage.getItem(PLAN_KEY);
            return plan ? JSON.parse(plan) : null;
        } catch (error) {
            console.error('Error getting plan:', error);
            const plan = await AsyncStorage.getItem(PLAN_KEY);
            return plan ? JSON.parse(plan) : null;
        }
    },

    saveUserData: async (userData) => {
        try {
            // Save locally
            await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));

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
                        allergies: userData.allergies,
                        workout_location: userData.workoutLocation,
                        available_equipment: userData.equipment,
                        preferred_duration: parseInt(userData.preferredDuration),
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
            await AsyncStorage.setItem(ONBOARDED_KEY, JSON.stringify(status));
        } catch (error) {
            console.error('Error setting onboarded state:', error);
        }
    },

    getIsOnboarded: async () => {
        try {
            const onboarded = await AsyncStorage.getItem(ONBOARDED_KEY);
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
                        workoutLocation: data.workout_location,
                        equipment: data.available_equipment,
                        preferred_duration: data.preferred_duration
                    };
                }
            }

            // Fallback to local
            const data = await AsyncStorage.getItem(USER_DATA_KEY);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting user data:', error);
            const data = await AsyncStorage.getItem(USER_DATA_KEY);
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
                    image_url: mealData.image_url || null
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

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data, error } = await supabase
                .from('meal_logs')
                .select('calories, protein, carbs, fats')
                .eq('user_id', session.user.id)
                .gte('created_at', today.toISOString());

            if (error) throw error;

            return data.reduce((acc, curr) => ({
                calories: acc.calories + (curr.calories || 0),
                protein: acc.protein + (curr.protein || 0),
                carbs: acc.carbs + (curr.carbs || 0),
                fats: acc.fats + (curr.fats || 0)
            }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
        } catch (error) {
            console.error('Error getting today nutrition:', error);
            return { calories: 0, protein: 0, carbs: 0, fats: 0 };
        }
    },

    clearAll: async () => {
        try {
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
                        image_url: mealData.imageUri // We could upload this to storage later
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
    }
};
