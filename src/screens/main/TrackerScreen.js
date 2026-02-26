import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import {
    LineChart,
    BarChart,
    PieChart,
    ContributionGraph,
    StackedBarChart
} from 'react-native-chart-kit';
import {
    Activity,
    TrendingUp,
    Zap,
    Target,
    Flame,
    Utensils,
    Calendar,
    ChevronRight,
    Award
} from 'lucide-react-native';
import { theme } from '../../theme';
import { storageService } from '../../services/storageService';
import { aiService } from '../../services/aiService';
import { useFocusEffect } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width - 32;

const TrackerScreen = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState(null);
    const [plan, setPlan] = useState(null);
    const [userData, setUserData] = useState(null);
    const [selectedDayIndex, setSelectedDayIndex] = useState(6); // Default to latest day (today)
    const [aiInsight, setAiInsight] = useState('');
    const [loadingInsight, setLoadingInsight] = useState(false);

    const loadData = async () => {
        try {
            const [weeklyStats, currentPlan, currentData] = await Promise.all([
                storageService.getWeeklyStats(),
                storageService.getPlan(),
                storageService.getUserData()
            ]);
            setStats(weeklyStats);
            setPlan(currentPlan);
            setUserData(currentData);

            // Fetch AI insight if we have stats
            if (weeklyStats && currentData) {
                setLoadingInsight(true);
                const insight = await aiService.getTrackerInsights(weeklyStats, currentData);
                setAiInsight(insight);
                setLoadingInsight(false);
            }
        } catch (error) {
            console.error('Error loading tracker data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Analyzing progress...</Text>
            </View>
        );
    }

    const chartConfig = {
        backgroundGradientFrom: theme.colors.surface,
        backgroundGradientTo: theme.colors.surface,
        color: (opacity = 1) => `rgba(19, 236, 91, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.5})`,
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        decimalPlaces: 0,
        propsForDots: {
            r: "5",
            strokeWidth: "2",
            stroke: theme.colors.primary
        }
    };

    const consistencyData = {
        labels: stats?.labels || ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        datasets: [
            {
                data: stats?.workoutData || [0, 0, 0, 0, 0, 0, 0],
                color: (opacity = 1) => `rgba(19, 236, 91, ${opacity})`,
                strokeWidth: 2
            },
            {
                data: stats?.dietData || [0, 0, 0, 0, 0, 0, 0],
                color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
                strokeWidth: 2
            }
        ],
        legend: ["Workout", "Diet"]
    };

    const calorieData = {
        labels: stats?.labels || ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        datasets: [
            {
                data: stats?.caloriesIntake || [0, 0, 0, 0, 0, 0, 0],
            }
        ]
    };

    const getInsight = () => {
        if (!stats) return "Start logging your workouts and meals to see insights!";

        const workoutCount = stats.workoutData.filter(d => d === 100).length;
        const dietCount = stats.dietData.filter(d => d === 100).length;

        if (workoutCount >= 5 && dietCount >= 5) {
            return "Incredible consistency! You're operating at elite levels this week.";
        } else if (workoutCount >= 3) {
            return "Solid workout streak. Try to sync your diet logs to match your training intensity.";
        } else if (dietCount >= 3) {
            return "Kitchen mastery detected. Pairing this with 1-2 more workouts will accelerate progress.";
        }
        return "Building momentum is key. Try to hit your targets today to start a new streak!";
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
            }
        >
            <View style={styles.header}>
                <View>
                    <Text style={styles.welcomeText}>Progress Tracker</Text>
                    <Text style={styles.subtitleText}>Weekly Performance Hub</Text>
                </View>
                <TouchableOpacity style={styles.profileBadge}>
                    <TrendingUp size={20} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Quick Stats Row */}
            <View style={styles.quickStatsRow}>
                <View style={styles.statCard}>
                    <Flame size={20} color={theme.colors.primary} />
                    <Text style={styles.statValue}>{stats?.workoutData.filter(d => d === 100).length || 0}</Text>
                    <Text style={styles.statLabel}>Workouts</Text>
                </View>
                <View style={[styles.statCard, { borderColor: 'rgba(255, 107, 107, 0.2)' }]}>
                    <Utensils size={20} color="#ff6b6b" />
                    <Text style={styles.statValue}>{stats?.dietData.filter(d => d === 100).length || 0}</Text>
                    <Text style={styles.statLabel}>Diet Logs</Text>
                </View>
                <View style={[styles.statCard, { borderColor: 'rgba(64, 156, 255, 0.2)' }]}>
                    <Award size={20} color="#409cff" />
                    <Text style={styles.statValue}>A+</Text>
                    <Text style={styles.statLabel}>Grade</Text>
                </View>
            </View>

            {/* Consistency Chart */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Execution Consistency (%)</Text>
                <View style={styles.chartWrapper}>
                    <LineChart
                        data={consistencyData}
                        width={screenWidth}
                        height={220}
                        chartConfig={chartConfig}
                        bezier
                        style={styles.chart}
                        onDataPointClick={({ index }) => setSelectedDayIndex(index)}
                    />
                </View>

                {/* Selected Day Execution Summary */}
                <View style={styles.selectedDayCard}>
                    <View style={styles.selectedDayHeader}>
                        <Calendar size={18} color={theme.colors.primary} />
                        <Text style={styles.selectedDayTitle}>
                            Execution Summary: {stats?.labels[selectedDayIndex]}
                        </Text>
                    </View>

                    <View style={styles.detailRows}>
                        <View style={styles.detailRow}>
                            <View style={styles.detailLabelGroup}>
                                <Flame size={16} color={stats?.workoutData[selectedDayIndex] === 100 ? theme.colors.primary : theme.colors.textMuted} />
                                <Text style={styles.detailLabel}>Workout Status</Text>
                            </View>
                            <View style={[
                                styles.statusBadge,
                                { backgroundColor: stats?.workoutData[selectedDayIndex] === 100 ? 'rgba(19, 236, 91, 0.1)' : 'rgba(255, 255, 255, 0.05)' }
                            ]}>
                                <Text style={[
                                    styles.statusText,
                                    { color: stats?.workoutData[selectedDayIndex] === 100 ? theme.colors.primary : theme.colors.textMuted }
                                ]}>
                                    {stats?.workoutData[selectedDayIndex] === 100 ? 'Completed' : 'Pending'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.detailRow}>
                            <View style={styles.detailLabelGroup}>
                                <Utensils size={16} color={stats?.dietData[selectedDayIndex] >= 66 ? "#ff6b6b" : theme.colors.textMuted} />
                                <Text style={styles.detailLabel}>Diet Mastery</Text>
                            </View>
                            <Text style={[
                                styles.detailValue,
                                { color: stats?.dietData[selectedDayIndex] >= 66 ? "#ff6b6b" : theme.colors.text }
                            ]}>
                                {stats?.dietData[selectedDayIndex]}%
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <View style={styles.detailLabelGroup}>
                                <TrendingUp size={16} color="#409cff" />
                                <Text style={styles.detailLabel}>Calories In</Text>
                            </View>
                            <Text style={styles.detailValue}>{stats?.caloriesIntake[selectedDayIndex]} kcal</Text>
                        </View>
                    </View>

                    {stats?.workoutData[selectedDayIndex] === 100 && (
                        <View style={styles.burnedEstimation}>
                            <Flame size={14} color={theme.colors.background} />
                            <Text style={styles.burnedText}>
                                Approx. {stats?.caloriesBurned[selectedDayIndex]} kcal burned
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Calorie Intake Chart */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Daily Calorie Intake (kcal)</Text>
                <View style={styles.chartWrapper}>
                    <BarChart
                        data={calorieData}
                        width={screenWidth}
                        height={220}
                        chartConfig={{
                            ...chartConfig,
                            color: (opacity = 1) => `rgba(64, 156, 255, ${opacity})`,
                        }}
                        style={styles.chart}
                        fromZero
                    />
                </View>
            </View>

            {/* AI Insights Card */}
            <View style={styles.insightCard}>
                <View style={styles.insightHeader}>
                    <Zap size={20} color={theme.colors.primary} />
                    <Text style={styles.insightTitle}>AI Power Insight</Text>
                    {loadingInsight && <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginLeft: 8 }} />}
                </View>
                <Text style={styles.insightText}>
                    {loadingInsight ? "Analyzing your performance trends..." : `"${aiInsight || getInsight()}"`}
                </Text>
                <View style={styles.divider} />
                <View style={styles.insightFooter}>
                    <Text style={styles.footerText}>Based on last 7 days activity</Text>
                    <ChevronRight size={16} color={theme.colors.textMuted} />
                </View>
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: theme.colors.text,
        marginTop: 16,
        fontSize: 16,
        opacity: 0.8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 48,
        marginBottom: 24,
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    subtitleText: {
        fontSize: 14,
        color: theme.colors.textMuted,
        marginTop: 4,
    },
    profileBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.2)',
    },
    quickStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    statCard: {
        width: (screenWidth / 3) - 8,
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.2)',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginVertical: 4,
    },
    statLabel: {
        fontSize: 10,
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 12,
        paddingLeft: 4,
    },
    chartWrapper: {
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
        padding: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    selectedDayCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    selectedDayHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    selectedDayTitle: {
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    detailRows: {
        gap: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabelGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailLabel: {
        color: theme.colors.textMuted,
        fontSize: 13,
    },
    detailValue: {
        color: theme.colors.text,
        fontSize: 13,
        fontWeight: '600',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    burnedEstimation: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginTop: 16,
        gap: 6,
        alignSelf: 'flex-start',
    },
    burnedText: {
        color: theme.colors.background,
        fontSize: 11,
        fontWeight: 'bold',
    },
    insightCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.1)',
        marginBottom: 24,
    },
    insightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    insightTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.primary,
        marginLeft: 8,
    },
    insightText: {
        fontSize: 15,
        color: theme.colors.text,
        lineHeight: 22,
        fontStyle: 'italic',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginVertical: 16,
    },
    insightFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: theme.colors.textMuted,
    },
});

export default TrackerScreen;
