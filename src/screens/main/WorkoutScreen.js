import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Alert,
    ImageBackground,
    Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { theme } from '../../theme';
import {
    Dumbbell,
    Clock,
    Zap,
    ChevronRight,
    RefreshCcw,
    Info,
    CheckCircle2,
    Lock,
    Play,
    Crosshair
} from 'lucide-react-native';
import { storageService } from '../../services/storageService';
import { aiService } from '../../services/aiService';

const { width } = Dimensions.get('window');

const WorkoutScreen = () => {
    const navigation = useNavigation();
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);
    const [userData, setUserData] = useState(null);
    const [selectedDay, setSelectedDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }));
    const [isCompleted, setIsCompleted] = useState(false);
    const [activeVideoUrl, setActiveVideoUrl] = useState(null);

    // Maps all 32 AI generated exercise names to their primary biomechanical tracker ID
    const LIVE_TRACKING_SUPPORTED = {
        // Squat Variants
        "Bodyweight Squats": "squat", "Jump Squats": "squat", "Goblet Squats": "squat", "Barbell Squats": "squat",

        // Press Variations (Chest & Shoulders)
        "Push-ups": "press_pushup", "Knee Push-ups": "press_knee_pushup", "Barbell Bench Press": "press_barbell_bench", "Dumbbell Bench Press": "press_dumbbell_bench", "Incline Dumbbell Press": "press_incline_bench", "Dumbbell Shoulder Press": "press_shoulder",

        // Pull & Row Variations (Back)
        "Lat Pulldowns": "pull_lat", "Seated Cable Rows": "pull_cable", "Dumbbell Rows": "pull_dumbbell",

        // Hinge Variations (Lower Back & Glutes)
        "Deadlifts": "hinge", "Romanian Deadlifts (RDLs)": "hinge",

        // Static Holds (Core)
        "Planks": "plank", "Side Planks": "plank",

        // Accessory/Isolation Variations
        "Dumbbell Bicep Curls": "accessory_arm", "Triceps Rope Pushdowns": "accessory_tricep", "Dumbbell Lateral Raises": "accessory_shoulder",
        "Leg Extensions": "accessory_leg", "Hamstring Curls": "accessory_leg",
        "Crunches": "accessory_core", "Cable Crunches": "accessory_core", "Bicycle Crunches": "accessory_core", "Mountain Climbers": "accessory_core",

        // Cardio/Full Body
        "Forward Lunges": "squat", "Reverse Lunges": "squat", "Burpees": "squat", "High Knees": "high_knees", "Jumping Jacks": "jumping_jacks"
    };

    // Dictionary matching exact exercise strings to Cloudinary URLs
    const EXERCISE_VIDEOS = {
        "Crunches": "https://res.cloudinary.com/dzytmknza/video/upload/v1772107154/Crunches_muplwh.mp4",
        "Side Planks": "https://res.cloudinary.com/dzytmknza/video/upload/v1772107155/Slide_Plank_nlbpuz.mp4",
        "Bodyweight Squats": "https://res.cloudinary.com/dzytmknza/video/upload/v1772020779/Cinematic_Squat_Form_Tutorial_Video_wfgf9o.mp4",
        "Push-ups": "https://res.cloudinary.com/dzytmknza/video/upload/v1772020870/Perfect_Push_Up_Video_Generation_bzjaar.mp4",
        "Reverse Lunges": "https://res.cloudinary.com/dzytmknza/video/upload/v1772020853/Realistic_Fitness_Animation_Generation_ea1a5s.mp4",
        "Forward Lunges": "https://res.cloudinary.com/dzytmknza/video/upload/v1772020855/Athlete_Lunge_Instructional_Video_Generated_e2glj1.mp4",
        "Jump Squats": "https://res.cloudinary.com/dzytmknza/video/upload/v1772255345/Jump_squat_hormrt.mp4",
        "Burpees": "https://res.cloudinary.com/dzytmknza/video/upload/v1772255345/Burpee_Video_Generation_wpwsto.mp4",
        "Glute Bridges": "https://res.cloudinary.com/dzytmknza/video/upload/v1772255345/Glute_Bridge_Exercise_Video_Generated_djsmpw.mp4",
        "Mountain Climbers": "https://res.cloudinary.com/dzytmknza/video/upload/v1772255345/Mountain_Climbers_Video_Generation_nqacca.mp4",
        "Planks": "https://res.cloudinary.com/dzytmknza/video/upload/v1772020862/Fitness_Model_Forearm_Plank_Video_bhik3a.mp4",
        "Jumping Jacks": "https://res.cloudinary.com/dzytmknza/video/upload/v1772256673/Jumping_Jacks_Video_Generated_eq5m8k.mp4",
        "Barbell Bench Press": "https://res.cloudinary.com/dzytmknza/video/upload/v1772256673/Barbell_Bench_Press_iilcq5.mp4",
        "Dumbbell Bench Press": "https://res.cloudinary.com/dzytmknza/video/upload/v1772256672/Fitness_Model_Dumbbell_Bench_Press_Video_joa1kz.mp4",
        "Lat Pulldowns": "https://res.cloudinary.com/dzytmknza/video/upload/v1772278467/Lat_Pulldowns_vgrc8v.mp4",
        "Incline Dumbbell Press": "https://res.cloudinary.com/dzytmknza/video/upload/v1772428711/Incline_Dumbbell_Press_spbubi.mp4",
        "Goblet Squats": "https://res.cloudinary.com/dzytmknza/video/upload/v1772428712/Goblet_Squats_d4fxmh.mp4",
        "Deadlifts": "https://res.cloudinary.com/dzytmknza/video/upload/v1772428712/Deadlifts_siuqxs.mp4",
        "Romanian Deadlifts (RDLs)": "https://res.cloudinary.com/dzytmknza/video/upload/v1772428712/Romanian_Deadlifts_zon81g.mp4",
        "Leg Press": "https://res.cloudinary.com/dzytmknza/video/upload/v1772428712/Leg_press_hseyiw.mp4",
        "High Knees": "https://res.cloudinary.com/dzytmknza/video/upload/v1772428712/High_Knees_trpq5f.mp4",
        "Dumbbell Rows": "https://res.cloudinary.com/dzytmknza/video/upload/v1772428713/Dumbbell_Rows_owwb23.mp4",
        "Dumbbell Lateral Raises": "https://res.cloudinary.com/dzytmknza/video/upload/v1772428713/Dumbbell_Lateral_Raises_sjfelu.mp4",
        "Dumbbell Shoulder Press": "https://res.cloudinary.com/dzytmknza/video/upload/v1772428714/Dumbbell_Shoulder_Press_jvxfbz.mp4",
        "Barbell Squats": "https://res.cloudinary.com/dzytmknza/video/upload/v1772428713/Barbell_Squats_kriuko.mp4",
        "Knee Push-ups": "https://res.cloudinary.com/dzytmknza/video/upload/v1772432511/Knee_Push_Up_ycqpxp.mp4",
        "Cable Crunches": "https://res.cloudinary.com/dzytmknza/video/upload/v1772432512/Cable_crunch_px5dr3.mp4",
        "Seated Cable Rows": "https://res.cloudinary.com/dzytmknza/video/upload/v1772432511/Seated_Cable_Row_Video_Generated_frg34j.mp4",
        "Triceps Rope Pushdowns": "https://res.cloudinary.com/dzytmknza/video/upload/v1772432513/Triceps_Rope_Pushdowns_Video_Generated_tazhvo.mp4",
        "Dumbbell Bicep Curls": "https://res.cloudinary.com/dzytmknza/video/upload/v1772432511/Dumbbell_Bicep_Curls_nh4q1u.mp4",
        "Bicycle Crunches": "https://res.cloudinary.com/dzytmknza/video/upload/v1772437610/Bicycle_crunches_estkvj.mp4",
        "Leg Extensions": "https://res.cloudinary.com/dzytmknza/video/upload/v1772438427/Leg_extension_tmbhdp.mp4",
        "Hamstring Curls": "https://res.cloudinary.com/dzytmknza/video/upload/v1772438430/Hamstring_curls_ursz0t.mp4"
    };

    // Structured guidance for exercises
    const DETAILED_INSTRUCTIONS = {
        "Dumbbell Bicep Curls": {
            setup: "Stand facing the camera or slightly angled. Keep your elbows tucked into your sides.",
            action: "Lift the weights toward your shoulders while keeping your upper arms stationary.",
            cue: "Squeeze your biceps at the top and lower the weight slowly. Don't swing your body."
        },
        "Triceps Rope Pushdowns": {
            setup: "Stand at the cable machine. Side profile required.",
            action: "Push the bar down until your arms are fully straight.",
            cue: "Keep your elbows 'glued' to your ribs. Only your forearms should move."
        },
        "Dumbbell Lateral Raises": {
            setup: "Stand tall, facing the camera directly.",
            action: "Raise your arms out to the sides until they are parallel to the floor.",
            cue: "Lead with your elbows and keep a slight bend in them. Avoid shrugging your shoulders."
        },
        "Bodyweight Squats": {
            setup: "Stand with feet shoulder-width apart, facing sideways to the camera.",
            action: "Lower your hips as if sitting in a chair until your thighs are parallel to the floor.",
            cue: "Keep your chest up and weight in your heels. Drive up through your mid-foot."
        },
        "Goblet Squats": {
            setup: "Hold the weight against your chest with both hands. Stand sideways.",
            action: "Lower your hips until thighs are parallel to the floor, keeping the weight close to your chest.",
            cue: "Keep your elbows inside your knees at the bottom. Push through your heels."
        },
        "Jump Squats": {
            setup: "Stand sideways with feet shoulder-width apart.",
            action: "Perform a squat and explode upward from the bottom, jumping off the floor.",
            cue: "Land softly on the balls of your feet and immediately sink back into the next squat."
        },
        "Barbell Squats": {
            setup: "Position the bar on your upper back. Stand sideways to the camera.",
            action: "Squat down until your hips are parallel with your knees, then drive back up.",
            cue: "Brace your core and keep your back flat. Don't let your knees cave inward."
        },
        "Forward Lunges": {
            setup: "Stand tall with feet hip-width apart. Stand sideways.",
            action: "Step one foot forward and lower your hips until both knees are bent at a 90-degree angle.",
            cue: "Keep your torso upright and don't let your front knee travel past your toes."
        },
        "Reverse Lunges": {
            setup: "Stand tall with feet hip-width apart. Stand sideways.",
            action: "Step one foot backward and lower your back knee toward the floor.",
            cue: "Maintain your balance and keep your front shin vertical throughout the movement."
        },
        "Barbell Bench Press": {
            setup: "Lie flat on the bench. Side or head-on diagonal camera view is best.",
            action: "Lower the bar to your mid-chest, then drive it back up to full arm extension.",
            cue: "Keep your feet planted and your back slightly arched. Control the bar on the way down."
        },
        "Dumbbell Bench Press": {
            setup: "Lie on the bench with a dumbbell in each hand. Side profile preferred.",
            action: "Press the weights upward until your arms are straight. Bring them down to the sides of your chest.",
            cue: "Touch the dumbbells lightly at the top and focus on stretching the chest at the bottom."
        },
        "Incline Dumbbell Press": {
            setup: "Bench set to a 30-45 degree angle. Side profile required.",
            action: "Press the weights vertically up from your upper chest.",
            cue: "Focus on the upper chest. Don't let the weights drift too far forward or back."
        },
        "Dumbbell Shoulder Press": {
            setup: "Sit or stand tall. Side profile is best for the AI to see the elbow-to-shoulder alignment.",
            action: "Press the weights directly overhead until your elbows lock out.",
            cue: "Don't arch your lower back. Reach for the ceiling and keep your core braced."
        },
        "Lat Pulldowns": {
            setup: "Sit at the machine. Front or diagonal camera view needed.",
            action: "Pull the bar down toward your upper chest mientras leaning slightly back.",
            cue: "Pull with your elbows, not your hands. Squeeze your shoulder blades together at the bottom."
        },
        "Seated Cable Rows": {
            setup: "Sit with feet on platforms. Side profile required.",
            action: "Pull the handle toward your lower stomach, keeping your back straight.",
            cue: "Don't lean too far back. Stretch your lats forward, then pull with your back muscles."
        },
        "Dumbbell Rows": {
            setup: "Bend over with one hand on a bench. Side profile required.",
            action: "Pull the dumbbell up toward your hip, keeping your elbow close to your body.",
            cue: "Imagine pulling your elbow toward the ceiling. Keep your back flat and parallel to the floor."
        },
        "Deadlifts": {
            setup: "Stand with feet hip-width apart. Camera must see your side profile.",
            action: "Hinge at your hips and lower the weight along your shins, then stand up tall.",
            cue: "Push your hips back as far as possible. Keep your back flat and the weight close to your body."
        },
        "Romanian Deadlifts (RDLs)": {
            setup: "Feet hip-width apart. Stand sideways to the camera.",
            action: "Hinge at the hips, lowering the weight only as far as your hamstrings allow while keeping a flat back.",
            cue: "Focus on the stretch in your hamstrings. Do not round your lower back."
        },
        "Planks": {
            setup: "Hold a straight line from head to toe. The camera should see your side profile.",
            action: "Maintain the position without movement, keeping your body parallel to the floor.",
            cue: "Squeeze your glutes and core. Don't let your hips pike up or sag down."
        },
        "Side Planks": {
            setup: "Lie on your side with feet stacked. Prop yourself up on one elbow. Side profile to camera.",
            action: "Lift your hips until your body forms a straight line from head to feet.",
            cue: "Keep your chest open and don't let your hips drop toward the floor."
        },
        "High Knees": {
            setup: "Stand sideways to the camera.",
            action: "Run in place, driving your knees as high as your waist.",
            cue: "Land on the balls of your feet and keep a fast, steady pace. Pump your arms."
        },
        "Jumping Jacks": {
            setup: "Face the camera directly.",
            action: "Jump your feet out wide while bringing your hands together above your head.",
            cue: "Jump with light feet. Coordinate your arms and legs to move at the same time."
        },
        "Push-ups": {
            setup: "Place hands slightly wider than shoulder-width. Keep your body in a straight line from head to heels. Side profile required.",
            action: "Lower your body until your chest nearly touches the floor, then push back up.",
            cue: "Keep your core tight and don't let your hips sag. Keep your neck in a neutral position."
        },
        "Knee Push-ups": {
            setup: "Start on all fours, then walk hands forward until your body is straight from head to knees. Side profile required.",
            action: "Lower your chest toward the floor, then push back up to the starting position.",
            cue: "Focus on the chest and arms. Keep your core engaged and avoid arching your back."
        }
    };

    // expo-video setup
    const player = useVideoPlayer(activeVideoUrl, player => {
        player.loop = true;
        player.play();
    });

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [storedPlan, userProfile] = await Promise.all([
                storageService.getPlan(),
                storageService.getUserData()
            ]);
            setPlan(storedPlan);
            setUserData(userProfile);

            // Load completion status for today
            const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
            if (selectedDay === todayName) {
                const dateStr = storageService.getLocalDateString(new Date());
                const completed = await storageService.getWorkoutCompletion(dateStr);
                setIsCompleted(completed);
            }
        } catch (error) {
            console.error('Error loading workout data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const updateCompletionStatus = async () => {
            const getTargetDate = (dayName) => {
                const today = new Date();
                const currentDayIndex = today.getDay();
                const adjustedCurrentIndex = currentDayIndex === 0 ? 6 : currentDayIndex - 1;
                const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                const targetIndex = daysOfWeek.indexOf(dayName);
                const diff = targetIndex - adjustedCurrentIndex;
                const targetDate = new Date(today);
                targetDate.setDate(today.getDate() + diff);
                return storageService.getLocalDateString(targetDate);
            };

            const dateStr = getTargetDate(selectedDay);
            const completed = await storageService.getWorkoutCompletion(dateStr);
            setIsCompleted(completed);
        };
        if (plan) updateCompletionStatus();
    }, [selectedDay]);

    const handleToggleCompletion = async () => {
        const getTargetDate = (dayName) => {
            const today = new Date();
            const currentDayIndex = today.getDay();
            const adjustedCurrentIndex = currentDayIndex === 0 ? 6 : currentDayIndex - 1;
            const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const targetIndex = daysOfWeek.indexOf(dayName);
            const diff = targetIndex - adjustedCurrentIndex;
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + diff);
            return storageService.getLocalDateString(targetDate);
        };

        const dateStr = getTargetDate(selectedDay);
        const result = await storageService.toggleWorkoutCompletion(dateStr);
        if (result !== null) {
            setIsCompleted(result);
        }
    };

    const handleRegenerate = async () => {
        if (!userData || regenerating) return;

        Alert.alert(
            'Regenerate Plan',
            'I will create a fresh workout split based on your current profile. Proceed?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Regenerate',
                    onPress: async () => {
                        setRegenerating(true);
                        try {
                            const newPlan = await aiService.generateFitnessPlan(userData);
                            await storageService.savePlan(newPlan);
                            setPlan(newPlan);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to generate a new plan. Please try again.');
                        } finally {
                            setRegenerating(false);
                        }
                    }
                }
            ]
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
                <Dumbbell size={48} color={theme.colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Plan Generated</Text>
            <Text style={styles.emptyText}>Tap the button below to generate your personalized AI workout program.</Text>
            <TouchableOpacity style={styles.generateButton} onPress={handleRegenerate}>
                <Text style={styles.generateButtonText}>Generate My Plan</Text>
            </TouchableOpacity>
        </View>
    );

    const renderRecoveryAdvice = () => (
        <View style={styles.restDayAdviceCard}>
            <Info size={16} color={theme.colors.primary} />
            <Text style={styles.restDayAdviceText}>
                Consistency doesn't mean working out hard every day. Today is about tissue health and mobility to set you up for your next big session!
            </Text>
        </View>
    );

    const renderExercise = (exercise, index) => {
        const videoUrl = EXERCISE_VIDEOS[exercise.name];
        const trackerId = LIVE_TRACKING_SUPPORTED[exercise.name];

        return (
            <View key={index} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                    <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        <Text style={styles.exerciseSets}>
                            {exercise.sets} Sets • {exercise.reps} Reps
                        </Text>
                    </View>
                    <View style={styles.exerciseActions}>
                        {trackerId && (
                            <TouchableOpacity
                                style={styles.liveTrackButton}
                                onPress={() => {
                                    // Parse numeric values from strings like "3 Sets" or "10-12 Reps"
                                    const setMatch = exercise.sets.toString().match(/\d+/);
                                    const repMatch = exercise.reps.toString().match(/\d+/);

                                    navigation.navigate('Tracking', {
                                        autoStartExercise: trackerId,
                                        targetSets: setMatch ? parseInt(setMatch[0]) : 3,
                                        targetReps: repMatch ? parseInt(repMatch[0]) : 12
                                    });
                                }}
                            >
                                <Crosshair size={16} color={theme.colors.background} />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.playButton, !videoUrl && styles.playButtonDisabled]}
                            onPress={() => videoUrl ? setActiveVideoUrl(videoUrl) : Alert.alert('Video Unavailable', 'The video for this exercise is coming soon!')}
                        >
                            <Play size={16} color={theme.colors.background} fill={theme.colors.background} />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.instructionContainer}>
                    {DETAILED_INSTRUCTIONS[exercise.name] ? (
                        <View style={styles.detailedInstructionList}>
                            <View style={styles.instructionRow}>
                                <Text style={styles.instructionLabel}>Setup: </Text>
                                <Text style={styles.instructionText}>{DETAILED_INSTRUCTIONS[exercise.name].setup}</Text>
                            </View>
                            <View style={styles.instructionRow}>
                                <Text style={styles.instructionLabel}>Action: </Text>
                                <Text style={styles.instructionText}>{DETAILED_INSTRUCTIONS[exercise.name].action}</Text>
                            </View>
                            <View style={styles.instructionRow}>
                                <Text style={styles.instructionLabel}>Cue: </Text>
                                <Text style={styles.instructionText}>"{DETAILED_INSTRUCTIONS[exercise.name].cue}"</Text>
                            </View>
                        </View>
                    ) : (
                        <Text style={styles.instructionText}>{exercise.instruction}</Text>
                    )}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading your program...</Text>
            </View>
        );
    }

    const currentDayData = plan?.workoutPlan?.days?.find(d => d.day === selectedDay);
    const isRestDay = !currentDayData || currentDayData.isRestDay;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerSubtitle}>WEEKLY PROGRAM</Text>
                    <Text style={styles.headerTitle}>Workout Plan</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={[styles.actionButton, isCompleted && styles.completedButton]}
                        onPress={handleToggleCompletion}
                    >
                        <CheckCircle2
                            size={20}
                            color={isCompleted ? '#000' : theme.colors.primary}
                            fill={isCompleted ? theme.colors.primary : 'transparent'}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={handleRegenerate}
                        disabled={regenerating}
                    >
                        {regenerating ? (
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                        ) : (
                            <RefreshCcw size={20} color={theme.colors.primary} />
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Day Selector */}
            <View style={styles.daySelectorContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayScroll}>
                    {daysOfWeek.map((day) => {
                        const isActive = selectedDay === day;
                        const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;

                        return (
                            <TouchableOpacity
                                key={day}
                                style={[styles.dayButton, isActive && styles.dayActive]}
                                onPress={() => setSelectedDay(day)}
                            >
                                <Text style={[styles.dayText, isActive && styles.dayTextActive]}>
                                    {day.substring(0, 3)}
                                </Text>
                                {isToday && <View style={styles.todayDot} />}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {!plan ? (
                    renderEmptyState()
                ) : (
                    <View style={styles.content}>
                        <ImageBackground
                            source={{
                                uri: isRestDay
                                    ? 'https://images.unsplash.com/photo-1552196564-972d3493b64e?auto=format&fit=crop&q=80&w=2070'
                                    : 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=2069'
                            }}
                            style={styles.summaryCard}
                            imageStyle={{ borderRadius: 24, opacity: 0.4 }}
                        >
                            <View style={styles.summaryOverlay}>
                                <View style={[styles.focusBadge, isRestDay && styles.recoveryBadge]}>
                                    <View style={[styles.pulseDot, isRestDay && styles.recoveryDot]} />
                                    <Text style={[styles.focusBadgeText, isRestDay && styles.recoveryBadgeText]}>
                                        {isRestDay ? 'ACTIVE RECOVERY' : "TODAY'S FOCUS"}
                                    </Text>
                                </View>
                                <Text style={styles.focusTitle}>{currentDayData?.focus || 'Recovery & Rest'}</Text>
                                <View style={styles.statsRow}>
                                    <View style={styles.statItem}>
                                        <ListChecks size={14} color="#FFF" />
                                        <Text style={styles.statText}>
                                            {(currentDayData?.exercises?.filter(ex => !['Leg Press', 'Glute Bridges', 'Leg Extensions', 'Hamstring Curls'].includes(ex.name))?.length || 0)} {isRestDay ? 'Movements' : 'Exercises'}
                                        </Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <Clock size={14} color="#FFF" />
                                        <Text style={styles.statText}>
                                            {isRestDay ? '15-20' : (userData?.preferredDuration || 45)} mins
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </ImageBackground>

                        {isRestDay && renderRecoveryAdvice()}

                        <Text style={styles.sectionTitle}>{isRestDay ? 'Recovery Routine' : 'Exercise List'}</Text>
                        {currentDayData?.exercises?.filter(ex => !['Leg Press', 'Glute Bridges', 'Leg Extensions', 'Hamstring Curls'].includes(ex.name)).map(renderExercise)}
                    </View>
                )}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Video Player Modal */}
            <Modal
                visible={!!activeVideoUrl}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setActiveVideoUrl(null)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalCloseArea}
                        onPress={() => setActiveVideoUrl(null)}
                    />
                    <View style={styles.videoContainer}>
                        {activeVideoUrl && (
                            <VideoView
                                player={player}
                                style={styles.videoPlayer}
                                allowsFullscreen
                                allowsPictureInPicture
                            />
                        )}
                        <TouchableOpacity style={styles.closeVideoButton} onPress={() => setActiveVideoUrl(null)}>
                            <Text style={styles.closeVideoText}>Close Video</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

// Re-using Lucide Icon locally for clarity
const ListChecks = ({ size, color }) => (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <CheckCircle2 size={size} color={color} />
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerSubtitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.colors.primary,
        letterSpacing: 1.5,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginTop: 4,
    },
    refreshButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.2)',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    actionButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    completedButton: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    daySelectorContainer: {
        marginBottom: 10,
    },
    dayScroll: {
        paddingHorizontal: 20,
        gap: 12,
        paddingBottom: 10,
    },
    dayButton: {
        width: 48,
        height: 56,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    dayActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    dayText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.textMuted,
    },
    dayTextActive: {
        color: theme.colors.background,
    },
    todayDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: theme.colors.primary,
        marginTop: 4,
        position: 'absolute',
        bottom: 8,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        color: theme.colors.textMuted,
        fontSize: 16,
    },
    scrollContent: {
        paddingTop: 10,
    },
    content: {
        paddingHorizontal: 20,
    },
    summaryCard: {
        height: 180,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: 'rgba(0,0,0,0.4)',
        marginBottom: 30,
    },
    summaryOverlay: {
        flex: 1,
        padding: 24,
        justifyContent: 'flex-end',
    },
    focusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(19, 236, 91, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 10,
        gap: 6,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.primary,
    },
    focusBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    focusTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 15,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
    },
    statDivider: {
        width: 1,
        height: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 20,
    },
    exerciseCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    exerciseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    exerciseInfo: {
        flex: 1,
    },
    exerciseName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    exerciseSets: {
        fontSize: 14,
        color: theme.colors.primary,
        marginTop: 4,
        fontWeight: '600',
    },
    exerciseActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    liveTrackButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButtonDisabled: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        opacity: 0.5,
    },
    instructionContainer: {
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    instructionText: {
        fontSize: 14,
        lineHeight: 20,
        color: theme.colors.textMuted,
        flex: 1,
    },
    detailedInstructionList: {
        gap: 8,
    },
    instructionRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    instructionLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.primary,
        width: 55,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: 60,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 15,
        color: theme.colors.textMuted,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    generateButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 16,
    },
    generateButtonText: {
        color: theme.colors.background,
        fontSize: 16,
        fontWeight: 'bold',
    },
    restDayContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        marginTop: 40,
    },
    restDayIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(19, 236, 91, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 2,
        borderColor: 'rgba(19, 236, 91, 0.1)',
        borderStyle: 'dashed',
    },
    restDayTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 16,
    },
    restDayText: {
        fontSize: 16,
        color: theme.colors.textMuted,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    restDayAdviceCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.2)',
        marginBottom: 24,
    },
    recoveryBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    recoveryDot: {
        backgroundColor: '#FFF',
    },
    recoveryBadgeText: {
        color: '#FFF',
    },
    restDayAdviceText: {
        flex: 1,
        fontSize: 13,
        color: theme.colors.text,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseArea: {
        ...StyleSheet.absoluteFillObject,
    },
    videoContainer: {
        width: width * 0.9,
        height: width * 1.6, // Aspect ratio roughly 16:9 vertical
        backgroundColor: '#000',
        borderRadius: 24,
        overflow: 'hidden',
        alignItems: 'center',
    },
    videoPlayer: {
        width: '100%',
        height: '100%',
    },
    closeVideoButton: {
        position: 'absolute',
        bottom: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    closeVideoText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    }
});

export default WorkoutScreen;
