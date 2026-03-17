import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Platform,
    Switch,
    Alert
} from 'react-native';
import { ChevronLeft, Bell, Clock, Calendar, Zap, Target, UtensilsCrossed, MessageSquare, TrendingUp } from 'lucide-react-native';
import { theme } from '../../theme';
import { storageService } from '../../services/storageService';
import DateTimePicker from '@react-native-community/datetimepicker';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CATEGORIES = [
    { id: 'all', label: 'All', icon: Bell },
    { id: 'workouts', label: 'Workouts', icon: Zap },
    { id: 'nutrition', label: 'Nutrition', icon: UtensilsCrossed },
    { id: 'coaching', label: 'Coaching', icon: MessageSquare }
];

const INITIAL_ALERTS = [
    {
        id: '1',
        category: 'coaching',
        title: 'Goal Milestone! 🏆',
        message: 'Vikram, you’re only 2kg away from your target! Ready to crush today’s workout?',
        time: '2h ago',
        read: false
    },
    {
        id: '2',
        category: 'workouts',
        title: 'Form Improvement 📈',
        message: 'Great job on yesterday’s squats! Your depth improved by 10%. Keep it up!',
        time: '5h ago',
        read: true
    },
    {
        id: '3',
        category: 'coaching',
        title: 'Consistency King 👑',
        message: 'You’ve been consistent for 5 days. Keep the streak alive and hit that 7-day mark!',
        time: '1d ago',
        read: true
    },
    {
        id: '4',
        category: 'nutrition',
        title: 'Meal Log Reminder 📸',
        message: 'Don’t forget to scan your lunch! Keeping track helps your AI coach refine your plan.',
        time: '1d ago',
        read: true
    }
];

const NotificationsScreen = ({ navigation }) => {
    const [reminderEnabled, setReminderEnabled] = useState(true);
    const [reminderTime, setReminderTime] = useState(new Date(new Date().setHours(7, 30, 0, 0)));
    const [selectedDays, setSelectedDays] = useState(['Mon', 'Wed', 'Fri']);
    const [activeCategory, setActiveCategory] = useState('all');
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [alerts, setAlerts] = useState(INITIAL_ALERTS);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await storageService.getWorkoutReminder();
            if (settings) {
                setReminderEnabled(settings.enabled);
                setReminderTime(new Date(settings.time));
                setSelectedDays(settings.days);
            }
        } catch (error) {
            console.error('Error loading notification settings:', error);
        }
    };

    const saveSettings = async (enabled, time, days) => {
        try {
            await storageService.saveWorkoutReminder({ enabled, time: time.toISOString(), days });
        } catch (error) {
            console.error('Error saving notification settings:', error);
        }
    };

    const toggleDay = (day) => {
        const newDays = selectedDays.includes(day)
            ? selectedDays.filter(d => d !== day)
            : [...selectedDays, day];
        setSelectedDays(newDays);
        saveSettings(reminderEnabled, reminderTime, newDays);
    };

    const handleTimeChange = (event, selectedDate) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setReminderTime(selectedDate);
            saveSettings(reminderEnabled, selectedDate, selectedDays);
        }
    };

    const filteredAlerts = activeCategory === 'all'
        ? alerts
        : alerts.filter(a => a.category === activeCategory);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ChevronLeft color={theme.colors.text} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <TouchableOpacity
                    onPress={() => setAlerts(alerts.map(a => ({ ...a, read: true })))}
                >
                    <Text style={styles.markReadText}>Mark Read</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Workout Reminder Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <Clock size={20} color={theme.colors.primary} />
                            <Text style={styles.sectionTitle}>Workout Reminder</Text>
                        </View>
                        <Switch
                            value={reminderEnabled}
                            onValueChange={(val) => {
                                setReminderEnabled(val);
                                saveSettings(val, reminderTime, selectedDays);
                            }}
                            trackColor={{ false: '#333', true: theme.colors.primary }}
                            thumbColor={Platform.OS === 'ios' ? '#fff' : (reminderEnabled ? '#fff' : '#999')}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.timeRow, !reminderEnabled && { opacity: 0.5 }]}
                        onPress={() => reminderEnabled && setShowTimePicker(true)}
                        disabled={!reminderEnabled}
                    >
                        <View>
                            <Text style={styles.reminderLabel}>Schedule your session</Text>
                            <Text style={styles.reminderTime}>
                                {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                        <View style={styles.editButton}>
                            <Text style={styles.editButtonText}>Edit</Text>
                        </View>
                    </TouchableOpacity>

                    {showTimePicker && (
                        <DateTimePicker
                            value={reminderTime}
                            mode="time"
                            is24Hour={false}
                            display="default"
                            onChange={handleTimeChange}
                        />
                    )}

                    <View style={styles.daysContent}>
                        <Text style={styles.daysLabel}>Active on</Text>
                        <View style={styles.daysRow}>
                            {DAYS.map(day => (
                                <TouchableOpacity
                                    key={day}
                                    style={[
                                        styles.dayChip,
                                        selectedDays.includes(day) && styles.dayChipActive,
                                        !reminderEnabled && { opacity: 0.3 }
                                    ]}
                                    onPress={() => reminderEnabled && toggleDay(day)}
                                    disabled={!reminderEnabled}
                                >
                                    <Text style={[
                                        styles.dayChipText,
                                        selectedDays.includes(day) && styles.dayChipTextActive
                                    ]}>{day[0]}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Filters */}
                <View style={styles.filterContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {CATEGORIES.map(cat => {
                            const Icon = cat.icon;
                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[
                                        styles.filterChip,
                                        activeCategory === cat.id && styles.filterChipActive
                                    ]}
                                    onPress={() => setActiveCategory(cat.id)}
                                >
                                    <Icon
                                        size={16}
                                        color={activeCategory === cat.id ? theme.colors.background : theme.colors.text}
                                    />
                                    <Text style={[
                                        styles.filterChipText,
                                        activeCategory === cat.id && styles.filterChipTextActive
                                    ]}>{cat.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Coaching Alerts */}
                <View style={styles.alertsList}>
                    {filteredAlerts.length > 0 ? (
                        filteredAlerts.map(alert => (
                            <View key={alert.id} style={[styles.alertCard, !alert.read && styles.unreadCard]}>
                                <View style={styles.alertHeader}>
                                    <Text style={styles.alertTitle}>{alert.title}</Text>
                                    <Text style={styles.alertTime}>{alert.time}</Text>
                                </View>
                                <Text style={styles.alertMessage}>{alert.message}</Text>
                                {!alert.read && <View style={styles.unreadDot} />}
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Bell size={48} color="rgba(255,255,255,0.1)" />
                            <Text style={styles.emptyText}>All caught up!</Text>
                        </View>
                    )}
                </View>

                <View style={styles.footerSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 15,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: theme.colors.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
    markReadText: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    scrollContent: {
        padding: 20,
    },
    section: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    sectionTitle: {
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 15,
        borderRadius: 16,
        marginBottom: 20,
    },
    reminderLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        marginBottom: 4,
    },
    reminderTime: {
        color: theme.colors.text,
        fontSize: 24,
        fontWeight: 'bold',
    },
    editButton: {
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    editButtonText: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: 'bold',
    },
    daysContent: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingTop: 15,
    },
    daysLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        marginBottom: 12,
    },
    daysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dayChip: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayChipActive: {
        backgroundColor: theme.colors.primary,
    },
    dayChipText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        fontWeight: 'bold',
    },
    dayChipTextActive: {
        color: theme.colors.background,
    },
    filterContainer: {
        marginBottom: 20,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 10,
        gap: 8,
    },
    filterChipActive: {
        backgroundColor: theme.colors.primary,
    },
    filterChipText: {
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: '600',
    },
    filterChipTextActive: {
        color: theme.colors.background,
    },
    alertsList: {
        gap: 12,
    },
    alertCard: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        position: 'relative',
    },
    unreadCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderColor: 'rgba(19, 236, 91, 0.1)',
    },
    alertHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    alertTitle: {
        color: theme.colors.text,
        fontSize: 15,
        fontWeight: 'bold',
    },
    alertTime: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
    },
    alertMessage: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        lineHeight: 20,
    },
    unreadDot: {
        position: 'absolute',
        top: 15,
        right: 15,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.primary,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 50,
        gap: 15,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.2)',
        fontSize: 16,
        fontWeight: '600',
    },
    footerSpacer: {
        height: 100,
    }
});

export default NotificationsScreen;
