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
    Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import {
    Layout,
    RefreshCcw,
    Zap,
    Scale,
    Wheat,
    Flame,
    Beef,
    Clock,
    CheckCircle2,
    ChevronRight,
    Star,
    X,
    Utensils,
    ListChecks,
    AlertTriangle
} from 'lucide-react-native';
import { storageService } from '../../services/storageService';
import { aiService } from '../../services/aiService';

const { width } = Dimensions.get('window');

const DietScreen = () => {
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);
    const [userData, setUserData] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedMeal, setSelectedMeal] = useState(null);
    const [selectedDay, setSelectedDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }));
    const [completions, setCompletions] = useState([]);

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // Helper to get actual date string for the selected day in current week
    const getTargetDate = (dayName) => {
        const today = new Date();
        const currentDayIndex = today.getDay(); // 0 (Sun) to 6 (Sat)
        // Convert to 0 (Mon) to 6 (Sun)
        const adjustedCurrentIndex = currentDayIndex === 0 ? 6 : currentDayIndex - 1;
        const targetIndex = daysOfWeek.indexOf(dayName);

        const diff = targetIndex - adjustedCurrentIndex;
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + diff);
        return storageService.getLocalDateString(targetDate);
    };

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

            // Load completions for current day
            const dateStr = getTargetDate(selectedDay);
            const dailyCompletions = await storageService.getMealCompletions(dateStr);
            setCompletions(dailyCompletions);
        } catch (error) {
            console.error('Error loading diet data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const updateCompletions = async () => {
            const dateStr = getTargetDate(selectedDay);
            const dailyCompletions = await storageService.getMealCompletions(dateStr);
            setCompletions(dailyCompletions);
        };
        if (plan) updateCompletions();
    }, [selectedDay]);

    const handleRegenerate = async () => {
        if (!userData || regenerating) return;

        Alert.alert(
            'Regenerate Plan',
            'I will create a fresh nutrition plan based on your current profile. Proceed?',
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

    const handleMealPress = (meal) => {
        setSelectedMeal(meal);
        setModalVisible(true);
    };

    const toggleMeal = async (mealType) => {
        const dateStr = getTargetDate(selectedDay);
        const result = await storageService.toggleMealCompletion(dateStr, mealType);
        if (result !== null) {
            setCompletions(prev =>
                result ? [...prev, mealType] : prev.filter(t => t !== mealType)
            );
        }
    };

    const renderMacro = (icon, label, value, color, unit = 'g') => (
        <View style={styles.macroCard}>
            <View style={[styles.macroIconContainer, { backgroundColor: `${color}15` }]}>
                {React.createElement(icon, { size: 20, color: color })}
            </View>
            <Text style={styles.macroValue}>{value}<Text style={styles.macroUnit}>{unit}</Text></Text>
            <Text style={styles.macroLabel}>{label}</Text>
        </View>
    );

    const renderMeal = (meal) => (
        <TouchableOpacity
            key={meal.type}
            style={styles.mealCard}
            activeOpacity={0.7}
            onPress={() => handleMealPress(meal)}
        >
            <View style={styles.mealHeader}>
                <View style={styles.mealTypeBadge}>
                    <Text style={styles.mealTypeText}>{meal.type}</Text>
                </View>
                <View style={styles.mealCalories}>
                    <Flame size={14} color="#FF6B6B" />
                    <Text style={styles.mealCalValue}>{meal.calories} kcal</Text>
                </View>
            </View>

            <Text style={styles.mealName}>{meal.name}</Text>

            <View style={styles.mealMacros}>
                <View style={styles.mealMacroItem}>
                    <View style={[styles.dot, { backgroundColor: '#FFD700' }]} />
                    <Text style={styles.mealMacroText}>P: {meal.macros.p}g</Text>
                </View>
                <View style={styles.mealMacroItem}>
                    <View style={[styles.dot, { backgroundColor: '#13EC5B' }]} />
                    <Text style={styles.mealMacroText}>C: {meal.macros.c}g</Text>
                </View>
                <View style={styles.mealMacroItem}>
                    <View style={[styles.dot, { backgroundColor: '#FF4500' }]} />
                    <Text style={styles.mealMacroText}>F: {meal.macros.f}g</Text>
                </View>

                <TouchableOpacity
                    style={[
                        styles.checkButton,
                        completions.includes(meal.type) && styles.checkButtonActive
                    ]}
                    onPress={() => toggleMeal(meal.type)}
                >
                    <CheckCircle2
                        size={20}
                        color={completions.includes(meal.type) ? theme.colors.background : theme.colors.primary}
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.mealFooter}>
                <Clock size={14} color={theme.colors.textMuted} />
                <Text style={styles.mealFooterText}>Best consumed within 2 hours</Text>
                <ChevronRight size={16} color={theme.colors.textMuted} style={{ marginLeft: 'auto' }} />
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Fetching your AI Diet...</Text>
            </View>
        );
    }

    const { nutritionPlan, greeting } = plan || {};

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerDate}>TODAY'S PLAN</Text>
                    <Text style={styles.headerTitle}>Nutrition Log</Text>
                </View>
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

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Greeting */}
                <View style={styles.greetingBox}>
                    <Zap size={20} color={theme.colors.primary} />
                    <Text style={styles.greetingText}>{greeting || "Stay fueled, stay focused."}</Text>
                </View>

                {/* Day Selector */}
                <View style={styles.daySelectorContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.daySelectorScroll}
                    >
                        {daysOfWeek.map((day) => {
                            const isSelected = selectedDay === day;
                            const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;
                            return (
                                <TouchableOpacity
                                    key={day}
                                    style={[
                                        styles.dayButton,
                                        isSelected && styles.dayButtonActive,
                                        isToday && !isSelected && styles.dayButtonToday
                                    ]}
                                    onPress={() => setSelectedDay(day)}
                                >
                                    <Text style={[
                                        styles.dayButtonText,
                                        isSelected && styles.dayButtonTextActive
                                    ]}>
                                        {day.substring(0, 3)}
                                    </Text>
                                    {isToday && <View style={styles.todayIndicator} />}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Macros Dashboard */}
                <View style={styles.macroGrid}>
                    <View style={styles.caloriesCard}>
                        <View style={styles.caloriesHeader}>
                            <Flame size={20} color="#FF6B6B" />
                            <Text style={styles.caloriesLabel}>Daily Target</Text>
                        </View>
                        <Text style={styles.caloriesValue}>{nutritionPlan?.calories || 0}</Text>
                        <Text style={styles.caloriesUnit}>kcal / day</Text>

                        <View style={styles.progressTrack}>
                            <View style={[styles.progressBar, { width: '65%' }]} />
                        </View>
                    </View>

                    <View style={styles.macroSubGrid}>
                        {renderMacro(Beef, 'Protein', nutritionPlan?.macros?.protein || 0, '#FFD700')}
                        {renderMacro(Wheat, 'Carbs', nutritionPlan?.macros?.carbs || 0, '#13EC5B')}
                        {renderMacro(Flame, 'Fats', nutritionPlan?.macros?.fats || 0, '#FF4500')}
                    </View>
                </View>

                {/* AI Insights */}
                <View style={styles.insightCard}>
                    <View style={styles.insightHeader}>
                        <Star size={18} color={theme.colors.primary} fill={theme.colors.primary} />
                        <Text style={styles.insightTitle}>Coach Insight</Text>
                    </View>
                    <Text style={styles.insightContent}>{nutritionPlan?.advice || "Balanced nutrition is key to consistent progress."}</Text>
                </View>

                {/* Meals List */}
                <View style={styles.mealsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{selectedDay} Menu</Text>
                        <View style={styles.activePlanBadge}>
                            <CheckCircle2 size={12} color={theme.colors.primary} />
                            <Text style={styles.activePlanText}>Weekly Plan</Text>
                        </View>
                    </View>

                    {(() => {
                        const dayData = nutritionPlan?.weeklyPlan?.find(d => d.day === selectedDay);
                        const dayMeals = dayData?.meals || nutritionPlan?.suggestedMeals;

                        if (dayMeals?.length > 0) {
                            return dayMeals.map(renderMeal);
                        }

                        return (
                            <View style={styles.missingRecipeBox}>
                                <AlertTriangle size={24} color="#FFD700" />
                                <Text style={styles.missingRecipeText}>
                                    No specific plan found for {selectedDay}.
                                </Text>
                                <TouchableOpacity
                                    style={styles.inlineRefreshButton}
                                    onPress={handleRegenerate}
                                >
                                    <RefreshCcw size={16} color={theme.colors.primary} />
                                    <Text style={styles.inlineRefreshText}>Generate Weekly Plan</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })()}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalTitleContainer}>
                                <Utensils size={18} color={theme.colors.primary} />
                                <Text style={styles.modalTitle}>{selectedMeal?.name}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <X size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                            <View style={styles.recipeMacroStrip}>
                                <View style={styles.recipeMacroItem}>
                                    <Text style={styles.recipeMacroVal}>{selectedMeal?.calories}</Text>
                                    <Text style={styles.recipeMacroLab}>kcal</Text>
                                </View>
                                <View style={styles.recipeMacroDivider} />
                                <View style={styles.recipeMacroItem}>
                                    <Text style={styles.recipeMacroVal}>{selectedMeal?.macros?.p}g</Text>
                                    <Text style={styles.recipeMacroLab}>Prot</Text>
                                </View>
                                <View style={styles.recipeMacroDivider} />
                                <View style={styles.recipeMacroItem}>
                                    <Text style={styles.recipeMacroVal}>{selectedMeal?.macros?.c}g</Text>
                                    <Text style={styles.recipeMacroLab}>Carb</Text>
                                </View>
                                <View style={styles.recipeMacroDivider} />
                                <View style={styles.recipeMacroItem}>
                                    <Text style={styles.recipeMacroVal}>{selectedMeal?.macros?.f}g</Text>
                                    <Text style={styles.recipeMacroLab}>Fat</Text>
                                </View>
                            </View>

                            <View style={styles.recipeSection}>
                                <View style={styles.sectionTitleRow}>
                                    <ListChecks size={20} color={theme.colors.primary} />
                                    <Text style={styles.recipeSectionTitle}>Ingredients</Text>
                                </View>
                                {!selectedMeal?.recipe && (
                                    <View style={styles.missingRecipeBox}>
                                        <AlertTriangle size={24} color="#FFD700" />
                                        <Text style={styles.missingRecipeText}>
                                            This plan was generated before the recipe feature was added.
                                        </Text>
                                        <TouchableOpacity
                                            style={styles.inlineRefreshButton}
                                            onPress={() => {
                                                setModalVisible(false);
                                                handleRegenerate();
                                            }}
                                        >
                                            <RefreshCcw size={16} color={theme.colors.primary} />
                                            <Text style={styles.inlineRefreshText}>Generate Recipes Now</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                                {selectedMeal?.recipe?.ingredients?.map((item, index) => (
                                    <View key={index} style={styles.ingredientCard}>
                                        <CheckCircle2 size={16} color={theme.colors.primary} />
                                        <Text style={styles.recipeText}>{item}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.recipeSection}>
                                <View style={styles.sectionTitleRow}>
                                    <Clock size={20} color={theme.colors.primary} />
                                    <Text style={styles.recipeSectionTitle}>Instructions</Text>
                                </View>
                                {selectedMeal?.recipe?.instructions?.map((item, index) => (
                                    <View key={index} style={styles.instructionStep}>
                                        <View style={styles.stepBadge}>
                                            <Text style={styles.stepNumber}>{index + 1}</Text>
                                        </View>
                                        <Text style={styles.recipeText}>{item}</Text>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: theme.colors.textMuted,
        marginTop: 12,
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerDate: {
        fontSize: 12,
        color: theme.colors.primary,
        fontWeight: 'bold',
        letterSpacing: 1.5,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    refreshButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    greetingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(19, 236, 91, 0.05)',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.1)',
    },
    greetingText: {
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 12,
        flex: 1,
    },
    daySelectorContainer: {
        marginBottom: 24,
        marginHorizontal: -20,
    },
    daySelectorScroll: {
        paddingHorizontal: 20,
        gap: 12,
    },
    dayButton: {
        width: 50,
        height: 60,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    dayButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    dayButtonToday: {
        borderColor: 'rgba(19, 236, 91, 0.3)',
    },
    dayButtonText: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 14,
        fontWeight: 'bold',
    },
    dayButtonTextActive: {
        color: '#000',
    },
    todayIndicator: {
        position: 'absolute',
        bottom: 8,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: theme.colors.primary,
    },
    macroGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    caloriesCard: {
        flex: 1.2,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
    },
    caloriesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    caloriesLabel: {
        fontSize: 12,
        color: theme.colors.textMuted,
        fontWeight: '600',
    },
    caloriesValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    caloriesUnit: {
        fontSize: 12,
        color: theme.colors.textMuted,
        marginBottom: 16,
    },
    progressTrack: {
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: 3,
    },
    macroSubGrid: {
        flex: 1,
        gap: 10,
    },
    macroCard: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    macroIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    macroValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    macroUnit: {
        fontSize: 10,
        color: theme.colors.textMuted,
    },
    macroLabel: {
        fontSize: 10,
        color: theme.colors.textMuted,
        fontWeight: '500',
        textTransform: 'uppercase',
    },
    insightCard: {
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.2)',
    },
    insightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    insightTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    insightContent: {
        fontSize: 14,
        color: theme.colors.text,
        lineHeight: 22,
        opacity: 0.9,
    },
    mealsSection: {
        gap: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    activePlanBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    activePlanText: {
        fontSize: 11,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    mealCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    mealHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    mealTypeBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    mealTypeText: {
        color: theme.colors.text,
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    mealCalories: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    mealCalValue: {
        color: '#FF6B6B',
        fontWeight: 'bold',
        fontSize: 14,
    },
    mealName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 12,
    },
    mealMacros: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    mealMacroItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    mealMacroText: {
        fontSize: 12,
        color: theme.colors.textMuted,
        fontWeight: '500',
    },
    mealFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        paddingTop: 12,
    },
    mealFooterText: {
        fontSize: 11,
        color: theme.colors.textMuted,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyStateText: {
        color: theme.colors.textMuted,
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '85%',
        paddingTop: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    modalTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
        flex: 1,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalScroll: {
        padding: 24,
        paddingBottom: 60,
    },
    recipeMacroStrip: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        padding: 20,
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    recipeMacroItem: {
        alignItems: 'center',
    },
    recipeMacroVal: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    recipeMacroLab: {
        fontSize: 10,
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        marginTop: 2,
    },
    recipeMacroDivider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    recipeSection: {
        marginBottom: 32,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    recipeSectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    ingredientCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 16,
        borderRadius: 16,
        marginBottom: 8,
    },
    instructionStep: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 20,
    },
    stepBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    stepNumber: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
    },
    recipeText: {
        fontSize: 15,
        lineHeight: 22,
        color: theme.colors.text,
        flex: 1,
    },
    missingRecipeBox: {
        backgroundColor: 'rgba(255, 215, 0, 0.05)',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.2)',
        marginBottom: 20,
    },
    missingRecipeText: {
        color: theme.colors.text,
        fontSize: 15,
        textAlign: 'center',
        marginTop: 12,
        marginBottom: 20,
        lineHeight: 22,
    },
    inlineRefreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.2)',
    },
    inlineRefreshText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    checkButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 'auto',
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.2)',
    },
    checkButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    }
});

export default DietScreen;
