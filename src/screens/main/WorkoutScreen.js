import React, { useState, useEffect } from 'react';
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
    Play
} from 'lucide-react-native';
import { storageService } from '../../services/storageService';
import { aiService } from '../../services/aiService';

const { width } = Dimensions.get('window');

const WorkoutScreen = () => {
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);
    const [userData, setUserData] = useState(null);
    const [selectedDay, setSelectedDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }));
    const [isCompleted, setIsCompleted] = useState(false);
    const [activeVideoUrl, setActiveVideoUrl] = useState(null);

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
        "Lat Pulldowns": "https://res.cloudinary.com/dzytmknza/video/upload/v1772278467/Lat_Pulldowns_vgrc8v.mp4"
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

        return (
            <View key={index} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                    <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        <Text style={styles.exerciseSets}>
                            {exercise.sets} Sets • {exercise.reps} Reps
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.playButton, !videoUrl && styles.playButtonDisabled]}
                        onPress={() => videoUrl ? setActiveVideoUrl(videoUrl) : Alert.alert('Video Unavailable', 'The video for this exercise is coming soon!')}
                    >
                        <Play size={16} color={theme.colors.background} fill={theme.colors.background} />
                    </TouchableOpacity>
                </View>
                <View style={styles.instructionContainer}>
                    <Text style={styles.instructionText}>{exercise.instruction}</Text>
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
                                            {currentDayData?.exercises?.length || 0} {isRestDay ? 'Movements' : 'Exercises'}
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
                        {currentDayData?.exercises?.map(renderExercise)}
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
    playButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.primary,
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
