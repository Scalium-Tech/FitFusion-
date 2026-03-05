import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ImageBackground,
    Dimensions,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Camera,
    Image as ImageIcon,
    ChevronLeft,
    ChevronRight,
    Zap,
    Scale,
    Flame,
    Beef,
    Wheat,
    CheckCircle,
    CheckCircle2,
    RefreshCcw,
    Trophy,
    Dumbbell,
    MessageSquare,
    Utensils,
    Search,
    Clock
} from 'lucide-react-native';
import { theme } from '../../theme';
import { storageService } from '../../services/storageService';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    const [plan, setPlan] = useState(null);
    const [userData, setUserData] = useState(null);
    const [todaysNutrition, setTodaysNutrition] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
    const [dietStreak, setDietStreak] = useState(0);
    const [workoutStreak, setWorkoutStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [burnedCalories, setBurnedCalories] = useState(0);
    const [recentScans, setRecentScans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadDashboardData = async () => {
        try {
            const [savedPlan, savedUserData, nutrition, dStreak, wStreak, bStreak, burned, dailyLogs] = await Promise.all([
                storageService.getPlan(),
                storageService.getUserData(),
                storageService.getTodaysNutrition(),
                storageService.getDietStreak(),
                storageService.getWorkoutStreak(),
                storageService.getBestStreak(),
                storageService.getTodaysBurnedCalories(),
                storageService.getDailyLogs()
            ]);
            setPlan(savedPlan);
            setUserData(savedUserData);
            setTodaysNutrition(nutrition);
            setDietStreak(dStreak);
            setWorkoutStreak(wStreak);
            setBestStreak(bStreak);
            setBurnedCalories(burned);
            setRecentScans(dailyLogs || []);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            loadDashboardData();
        }, [])
    );

    // Removed checkCameraRestart: now handled optimally in RootNavigator and MainTabNavigator

    // Find today's workout data
    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todaysWorkout = plan?.workoutPlan?.days?.find(d => d.day === todayName) || plan?.workoutPlan?.days?.[0];

    // Default Fallback/Mock data if nothing is saved yet
    const displayData = {
        name: userData?.name || 'Alex',
        greeting: plan?.greeting || "Ready for today's challenge?",
        workoutStreak: workoutStreak || 0,
        dietStreak: dietStreak || 0,
        bestStreak: bestStreak || 0,
        caloriesGoal: plan?.nutritionPlan?.calories || 2400,
        caloriesConsumed: todaysNutrition.calories,
        caloriesBurned: burnedCalories || 0,
        proteinGoal: plan?.nutritionPlan?.macros?.protein || 180,
        proteinConsumed: todaysNutrition.protein,
        carbsGoal: plan?.nutritionPlan?.macros?.carbs || 200,
        carbsConsumed: todaysNutrition.carbs,
        fatsGoal: plan?.nutritionPlan?.macros?.fats || 80,
        fatsConsumed: todaysNutrition.fats,
        currentWorkout: todaysWorkout?.focus || "Full Body Initializer",
        workoutCount: todaysWorkout?.exercises?.length || 8,
        insight: plan?.aiInsight || "Consistency is key. Your first AI-generated workout is ready!",
    };

    const renderMacroItem = (label, current, goal, color) => {
        const progress = goal > 0 ? Math.min(current / goal, 1) : 0;
        return (
            <View style={styles.macroItem} key={label}>
                <View style={styles.macroHeader}>
                    <Text style={styles.macroLabel}>{label}</Text>
                    <Text style={styles.macroValue}>{current}g / {goal}g</Text>
                </View>
                <View style={styles.macroTrack}>
                    <View style={[styles.macroProgress, { width: `${progress * 100}%`, backgroundColor: color }]} />
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={{ flex: 1, paddingRight: 20 }}>
                        <View style={styles.brandingContainer}>
                            <Text style={styles.brandingText}>FITFUSION AI</Text>
                        </View>
                        <Text style={styles.greetingText}>Hello, <Text style={{ color: theme.colors.primary }}>{displayData.name}!</Text></Text>
                        <Text style={styles.dateText} numberOfLines={2}>{displayData.greeting}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.profileButton}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=2070' }}
                            style={styles.profileImage}
                        />
                    </TouchableOpacity>
                </View>

                {/* Streaks */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.streaksContainer}
                >
                    <View style={styles.streakItem}>
                        <View style={[styles.streakIconCircle, { backgroundColor: 'rgba(255, 68, 68, 0.1)' }]}>
                            <Flame size={20} color="#FF4444" fill="#FF4444" />
                        </View>
                        <Text style={styles.streakItemCount}>{displayData.workoutStreak}d</Text>
                        <Text style={styles.streakItemTitle}>Workouts</Text>
                    </View>

                    <View style={styles.streakItem}>
                        <View style={[styles.streakIconCircle, { backgroundColor: 'rgba(19, 236, 91, 0.1)' }]}>
                            <CheckCircle size={20} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.streakItemCount}>{displayData.dietStreak}d</Text>
                        <Text style={styles.streakItemTitle}>Diet Plan</Text>
                    </View>

                    <View style={styles.streakItem}>
                        <View style={[styles.streakIconCircle, { backgroundColor: 'rgba(255, 184, 0, 0.1)' }]}>
                            <Trophy size={20} color="#FFB800" />
                        </View>
                        <Text style={styles.streakItemCount}>{displayData.bestStreak}d</Text>
                        <Text style={styles.streakItemTitle}>Best</Text>
                    </View>
                </ScrollView>

                {/* Today's Workout Card */}
                <Text style={styles.sectionTitle}>Today's Workout</Text>
                <TouchableOpacity
                    style={styles.workoutCard}
                    onPress={() => navigation.navigate('Workout')}
                >
                    <ImageBackground
                        source={{ uri: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=2070' }}
                        style={styles.workoutCardImage}
                        imageStyle={{ borderRadius: 24 }}
                    >
                        <View style={styles.workoutOverlay}>
                            <View style={styles.badge}>
                                <Zap size={12} color={theme.colors.primary} fill={theme.colors.primary} />
                                <Text style={styles.badgeText}>AI RECOMMENDED</Text>
                            </View>
                            <Text style={styles.workoutTitle}>{displayData.currentWorkout}</Text>
                            <Text style={styles.workoutSubtitle}>{displayData.workoutCount} Exercises • 45 mins • AI Guided</Text>
                        </View>
                    </ImageBackground>
                    <View style={styles.startButtonContainer}>
                        <TouchableOpacity
                            style={styles.startButton}
                            onPress={() => navigation.navigate('Workout')}
                        >
                            <Text style={styles.startButtonText}>Start</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>

                <View style={styles.aiInsightCard}>
                    <View style={styles.insightHeader}>
                        <Zap size={14} color={theme.colors.primary} />
                        <Text style={styles.insightHeaderText}>AI COACH TIP</Text>
                    </View>
                    <Text style={styles.insightQuote}>{displayData.insight}</Text>
                </View>

                {/* Calorie Progress */}
                <Text style={styles.sectionTitle}>Daily Nutrition</Text>
                <View style={styles.nutritionCard}>
                    <View style={styles.calorieContainer}>
                        <View style={styles.calorieCircle}>
                            <Text style={styles.caloriesLeft}>{displayData.caloriesGoal - displayData.caloriesConsumed}</Text>
                            <Text style={styles.caloriesUnit}>kcal left</Text>
                        </View>
                        <View style={styles.calorieInfo}>
                            <View style={styles.calorieSplit}>
                                <Text style={styles.calorieSplitVal}>{displayData.caloriesConsumed}</Text>
                                <Text style={styles.calorieSplitLabel}>Eaten</Text>
                            </View>
                            <View style={styles.calorieSeparator} />
                            <View style={styles.calorieSplit}>
                                <Text style={styles.calorieSplitVal}>{displayData.caloriesBurned}</Text>
                                <Text style={styles.calorieSplitLabel}>Burned</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.macrosContainer}>
                        {renderMacroItem('Protein', displayData.proteinConsumed, displayData.proteinGoal, '#FFD700')}
                        {renderMacroItem('Carbs', displayData.carbsConsumed, displayData.carbsGoal, '#13EC5B')}
                        {renderMacroItem('Fats', displayData.fatsConsumed, displayData.fatsGoal, '#FF4500')}
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActionsGrid}>
                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={() => navigation.navigate('MealScanner')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: 'rgba(19, 236, 91, 0.1)' }]}>
                            <Search size={24} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.actionText}>Scan Meal</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={() => navigation.navigate('Chat')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: 'rgba(30, 144, 255, 0.1)' }]}>
                            <MessageSquare size={24} color="#1E90FF" />
                        </View>
                        <Text style={styles.actionText}>AI Chat</Text>
                    </TouchableOpacity>
                </View>

                {/* Recent AI Scans */}
                {recentScans && recentScans.length > 0 && (
                    <View style={styles.scansContainer}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Today's AI Scans</Text>
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.scansScrollContent}
                        >
                            {recentScans.map((scan, index) => (
                                <View key={index} style={styles.scanCard}>
                                    <View style={styles.scanImageContainer}>
                                        {scan.image_url ? (
                                            <Image source={{ uri: scan.image_url }} style={styles.scanImage} />
                                        ) : (
                                            <View style={styles.scanIconFallback}>
                                                <Utensils size={32} color={theme.colors.primary} style={{ opacity: 0.5 }} />
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.scanInfo}>
                                        <Text style={styles.scanName} numberOfLines={1}>{scan.meal_name}</Text>
                                        {scan.confidence && (
                                            <View style={styles.confidenceBadge}>
                                                <CheckCircle2 size={10} color={theme.colors.primary} />
                                                <Text style={styles.confidenceText}>
                                                    {scan.confidence > 1 ? scan.confidence : Math.round(scan.confidence * 100)}% Match
                                                </Text>
                                            </View>
                                        )}
                                        <View style={styles.scanBadge}>
                                            <Flame size={10} color="#FF4444" fill="#FF4444" />
                                            <Text style={styles.scanBadgeText}>{scan.calories} kcal</Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                <View style={{ height: Platform.OS === 'ios' ? 120 : 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    greetingText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginTop: 4,
    },
    dateText: {
        fontSize: 14,
        color: theme.colors.textMuted,
        marginTop: 4,
    },
    profileButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(19, 236, 91, 0.3)',
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    streaksContainer: {
        paddingHorizontal: 20,
        paddingVertical: 24,
        gap: 16,
    },
    streakItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        minWidth: 100,
    },
    streakIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    streakItemCount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    streakItemTitle: {
        fontSize: 12,
        color: theme.colors.textMuted,
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginHorizontal: 20,
        marginTop: 10,
        marginBottom: 16,
    },
    workoutCard: {
        marginHorizontal: 20,
        height: 200,
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
    },
    workoutCardImage: {
        width: '100%',
        height: 180,
    },
    workoutOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        padding: 20,
        justifyContent: 'space-between',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        gap: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: theme.colors.background,
    },
    workoutTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    workoutSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 4,
    },
    startButtonContainer: {
        position: 'absolute',
        bottom: 20,
        right: 20,
    },
    startButton: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 12,
    },
    startButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.background,
    },
    nutritionCard: {
        marginHorizontal: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    calorieContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    calorieCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 8,
        borderColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    caloriesLeft: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    caloriesUnit: {
        fontSize: 12,
        color: theme.colors.textMuted,
    },
    calorieInfo: {
        flex: 1,
        paddingLeft: 30,
        gap: 12,
    },
    calorieSplit: {
        gap: 2,
    },
    calorieSplitVal: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    calorieSplitLabel: {
        fontSize: 12,
        color: theme.colors.textMuted,
    },
    calorieSeparator: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        width: '60%',
    },
    macrosContainer: {
        gap: 16,
    },
    macroItem: {
        gap: 8,
    },
    macroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    macroLabel: {
        fontSize: 14,
        color: theme.colors.text,
    },
    macroValue: {
        fontSize: 12,
        color: theme.colors.textMuted,
    },
    macroTrack: {
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    macroProgress: {
        height: '100%',
        borderRadius: 3,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginTop: 32,
        justifyContent: 'space-between',
    },
    actionItem: {
        alignItems: 'center',
        gap: 8,
    },
    actionIcon: {
        width: 60,
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    actionText: {
        fontSize: 12,
        color: theme.colors.text,
        fontWeight: '500',
    },
    scanBadge: {
        backgroundColor: 'rgba(255, 68, 68, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        marginTop: 6,
    },
    scanBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    scanInfo: {
        padding: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
    scanName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    confidenceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    confidenceText: {
        color: theme.colors.primary,
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 1,
    },
    aiInsightCard: {
        marginHorizontal: 20,
        backgroundColor: 'rgba(19, 236, 91, 0.08)',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.2)',
        marginTop: 12,
    },
    insightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    insightHeaderText: {
        color: theme.colors.primary,
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    insightQuote: {
        color: theme.colors.text,
        fontSize: 13,
        lineHeight: 18,
        fontStyle: 'italic',
    },
    brandingContainer: {
        marginBottom: 8,
    },
    brandingText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
        fontSize: 14,
        letterSpacing: 2,
        opacity: 0.8,
    },
});

export default HomeScreen;
