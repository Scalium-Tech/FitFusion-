import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.EXPO_PUBLIC_GOOGLE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export const aiService = {
    generateFitnessPlan: async (userData) => {
        const MAX_RETRIES = 2;

        const SUPPORTED_EXERCISES = [
            // Home Upper & Core
            "Push-ups", "Knee Push-ups", "Planks", "Side Planks",
            // Home Lower & Cardio
            "Bodyweight Squats", "Jump Squats", "Forward Lunges", "Reverse Lunges", "High Knees", "Jumping Jacks",
            // Gym Chest, Back & Shoulders
            "Barbell Bench Press", "Dumbbell Bench Press", "Incline Dumbbell Press", "Lat Pulldowns", "Seated Cable Rows", "Dumbbell Rows", "Dumbbell Shoulder Press", "Dumbbell Lateral Raises",
            // Gym Legs & Arms
            "Barbell Squats", "Goblet Squats", "Deadlifts", "Romanian Deadlifts (RDLs)", "Leg Extensions", "Hamstring Curls", "Dumbbell Bicep Curls", "Triceps Rope Pushdowns"
        ];

        const executeAttempt = async (attempt) => {
            try {
                console.log(`[AI Service] Plan generation attempt ${attempt + 1}/${MAX_RETRIES + 1}`);
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

                const prompt = `
                Act as an expert AI Fitness Coach. Create a comprehensive, personalized fitness and nutrition plan based on the following user data:
                
                User Profile:
                - Name: ${userData.name}
                - Goal: ${userData.goal}
                - Gender: ${userData.gender}
                - Age: ${userData.age}
                - Height: ${userData.height} ${userData.heightUnit}
                - Weight: ${userData.weight} ${userData.weightUnit}
                - Target Weight: ${userData.targetWeight} ${userData.targetWeightUnit}
                - Focus Areas: ${userData.focusAreas.join(', ')}
                - Health Conditions: ${userData.healthConditions.join(', ')}
                - Activity Level: ${userData.activityLevel}
                - Experience: ${userData.experience}
                - Training Days: ${userData.trainingDays} per week
                - Diet Type: ${userData.dietType}
                - Diet Budget: ₹${userData.dietBudget} per day (Maximum)
                - Region: ${userData.region || 'Global'}
                - Allergies: ${userData.allergies.join(', ')}
                - Workout Location: ${userData.workoutLocation}
                - Available Equipment: ${userData.equipment.join(', ')}
                - Preferred Duration: ${userData.preferredDuration} minutes

                Please provide the output STRICTLY in the following JSON format:
                {
                    "greeting": "Personalized string greeting mentioning their goal",
                    "workoutPlan": {
                        "splitName": "e.g., Push/Pull/Legs",
                        "days": [
                            {
                                "day": "Monday",
                                "focus": "e.g., Chest & Triceps",
                                "isRestDay": false,
                                "caloriesBurned": 350,
                                "exercises": [
                                    { "name": "Bench Press", "sets": 3, "reps": "10-12", "instruction": "Focus on slow eccentrics and full range of motion." }
                                ]
                            }
                        ]
                    },
                    "nutritionPlan": {
                        "calories": 2500,
                        "macros": { "protein": 180, "carbs": 250, "fats": 70 },
                        "advice": "General nutrition tips based on their diet type",
                        "weeklyPlan": [
                            {
                                "day": "Monday",
                                "meals": [
                                    { 
                                        "type": "Breakfast", 
                                        "name": "Meal Name", 
                                        "calories": 500, 
                                        "macros": { "p": 30, "c": 60, "f": 15 },
                                        "recipe": {
                                            "ingredients": ["1 cup oats", "2 eggs"],
                                            "instructions": ["Boil water", "Mix ingredients"]
                                        }
                                    },
                                    { "type": "Lunch", "name": "Meal", "calories": 700, "macros": { "p": 40, "c": 70, "f": 15 }, "recipe": { "ingredients": [], "instructions": [] } },
                                    { "type": "Dinner", "name": "Meal", "calories": 700, "macros": { "p": 40, "c": 70, "f": 15 }, "recipe": { "ingredients": [], "instructions": [] } },
                                    { "type": "Snacks", "name": "Meal", "calories": 400, "macros": { "p": 20, "c": 40, "f": 10 }, "recipe": { "ingredients": [], "instructions": [] } }
                                ]
                            }
                        ]
                    },
                    "aiInsight": "A motivational insight based on their specific profile"
                }

                CRITICAL REQUIREMENTS:
                1. Generate a COMPLETE 7-day plan (Monday through Sunday) for BOTH the "workoutPlan.days" and "nutritionPlan.weeklyPlan" arrays.
                2. For "workoutPlan.days", if a day is for rest, set "isRestDay": true but STILL provide a "focus" (e.g., "Active Recovery & Mobility") and a list of 3-4 specific exercises for stretching or light mobility. EVERY day must have a detailed plan.
                3. The "nutritionPlan.weeklyPlan" MUST be heavily influenced by the user's Region (${userData.region || 'Global'}), utilizing local ingredients, cuisines, and regional staple foods while strictly adhering to the Diet Budget constraint.
                4. For EVERY meal, the "recipe.instructions" should be concise but clear (2-3 steps max) to save generation time. Provide precise measurements (e.g., "150g").
                5. EXERCISE SELECTION: You MUST ONLY select exercises from the exact provided SUPPORTED_EXERCISES list below. Guarantee a 100% exact string match. Do NOT invent, append text, vary, or suggest any exercises outside of this precise list:
                   [${SUPPORTED_EXERCISES.join(', ')}]
                `;

                const textPromise = (async () => {
                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    return response.text();
                })();

                // 150 second timeout for complex generation
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('AI Generation timed out')), 150000)
                );

                const text = await Promise.race([textPromise, timeoutPromise]);

                // Clean the response in case Gemini adds markdown code blocks
                const cleanJson = text.replace(/```json|```/g, "").trim();
                const parsedPlan = JSON.parse(cleanJson);

                // Add unique IDs to all meals to prevent React key warnings
                if (parsedPlan.nutritionPlan && parsedPlan.nutritionPlan.weeklyPlan) {
                    parsedPlan.nutritionPlan.weeklyPlan = parsedPlan.nutritionPlan.weeklyPlan.map(day => {
                        return {
                            ...day,
                            meals: day.meals.map((meal, index) => ({
                                ...meal,
                                id: `${day.day}-${meal.type}-${index}`
                            }))
                        };
                    });
                }

                return parsedPlan;
            } catch (error) {
                console.error(`Attempt ${attempt + 1} failed:`, error.message);
                if (attempt < MAX_RETRIES) {
                    return executeAttempt(attempt + 1);
                }
                throw error;
            }
        };

        return executeAttempt(0);
    },

    getChatSession: async (userData, history = []) => {
        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                systemInstruction: `You are the "FitFusion AI Coach," a supportive, expert, and highly personalized fitness mentor. 
                You are talking to ${userData.name}.
                User Profile:
                - Goal: ${userData.goal}
                - Age/Gender: ${userData.age}yo ${userData.gender}
                - Stats: ${userData.weight}${userData.weightUnit}, ${userData.height}${userData.heightUnit}
                - Focus: ${userData.focusAreas?.join(', ')}
                - Activity: ${userData.activityLevel}
                - Experience: ${userData.experience}
                - Diet: ${userData.dietType} with ${userData.allergies?.join(', ') || 'no'} allergies.
                
                Guidelines:
                1. Always be encouraging but professional.
                2. Use the user's name (${userData.name}) occasionally.
                3. Keep answers concise (under 3-4 sentences unless explaining a move).
                4. Focus on science-based advice.
                5. If they ask about something dangerous, advise consulting a doctor.
                6. Reference their specific goal ("${userData.goal}") when relevant.`
            });

            return model.startChat({
                history: history,
                generationConfig: {
                    maxOutputTokens: 500,
                },
            });
        } catch (error) {
            console.error('Error starting AI chat:', error);
            throw error;
        }
    },

    analyzeMealImage: async (base64Image) => {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const prompt = `
            Identify the food in this image and provide its estimated nutritional content.
            Return the result STRICTLY as a JSON object with these fields:
            - name: "Common name of the meal"
            - calories: estimated total kcal
            - protein: estimated grams
            - carbs: estimated grams
            - fats: estimated grams
            - confidence: a number from 0 to 1 indicating your confidence in the identification
            - description: a detailed analysis STRICTLY in bullet points (use the "•" character). Each point should be on a new line. EXAMPLE: "• High in fiber.\n• Good protein source."
            `;

            const imagePart = {
                inlineData: {
                    data: base64Image,
                    mimeType: "image/jpeg"
                },
            };

            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text();

            // Clean the response
            const cleanJson = text.replace(/```json|```/g, "").trim();
            return JSON.parse(cleanJson);
        } catch (error) {
            console.error('Error analyzing meal image:', error);
            throw error;
        }
    },

    getTrackerInsights: async (stats, userData) => {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const prompt = `
            Act as an expert AI Fitness Analyst for the app "FitFusion". 
            Analyze the following weekly performance data for ${userData.name} and provide a single, punchy, motivational, and highly specific insight.

            User Profile:
            - Goal: ${userData.goal}
            - Experience: ${userData.experience}

            Weekly Stats (Last 7 Days):
            - Workout Completion (%) per day: ${stats.workoutData.join(', ')}
            - Diet Completion (%) per day: ${stats.dietData.join(', ')}
            - Daily Calorie Intake (kcal): ${stats.caloriesIntake.join(', ')}
            - Days Labels: ${stats.labels.join(', ')}

            Guidelines:
            1. Identify patterns (e.g., "consistent workouts until Wednesday, then a dip").
            2. Compare effort to their goal ("${userData.goal}").
            3. Mention a specific day if it stands out.
            4. Be encouraging but direct if they are falling behind.
            5. Keep the insight under 35 words.
            6. Do not include any JSON formatting, just the plain text string.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text().replace(/"/g, '').trim();
        } catch (error) {
            console.error('Error getting tracker insights:', error);
            return "Keep pushing! Every step counts towards your ultimate fitness goal.";
        }
    }
};
