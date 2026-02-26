import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Dimensions,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import {
    ChevronLeft,
    User,
    Mail,
    Scale,
    Ruler,
    Target,
    Zap,
    Settings,
    Calendar,
    MapPin,
    Utensils,
    AlertCircle,
    Clock,
    LogOut
} from 'lucide-react-native';
import { storageService } from '../../services/storageService';
import { supabase } from '../../services/supabaseClient';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userAuth, setUserAuth] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await storageService.getUserData();
            const { data: { session } } = await supabase.auth.getSession();
            setUserData(data);
            setUserAuth(session?.user);
        } catch (error) {
            console.error('Error loading profile data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await storageService.clearAll();
                        // RootNavigator will handle the redirect via onAuthStateChange
                    }
                }
            ]
        );
    };

    const renderCard = (icon, label, value, color) => (
        <View style={styles.infoCard}>
            <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
                {React.createElement(icon, { size: 20, color: color })}
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>{label}</Text>
                <Text style={styles.cardValue}>{value || 'Not set'}</Text>
            </View>
        </View>
    );

    const renderSectionHeader = (title) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.sectionLine} />
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ChevronLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <TouchableOpacity style={styles.settingsButton}>
                    <Settings size={22} color={theme.colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Profile Hero */}
                <View style={styles.heroSection}>
                    <View style={styles.imageWrapper}>
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=2070' }}
                            style={styles.profileImage}
                        />
                        <View style={styles.editBadge}>
                            <User size={12} color={theme.colors.background} />
                        </View>
                    </View>
                    <Text style={styles.userName}>{userData?.name || 'User'}</Text>
                    <Text style={styles.userGoal}>
                        {userData?.goal?.charAt(0).toUpperCase() + userData?.goal?.slice(1)} Journey
                    </Text>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                        <Scale size={18} color={theme.colors.primary} />
                        <Text style={styles.statValue}>{userData?.weight} {userData?.weightUnit}</Text>
                        <Text style={styles.statLabel}>Current</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Ruler size={18} color="#FFD700" />
                        <Text style={styles.statValue}>{userData?.height} {userData?.heightUnit}</Text>
                        <Text style={styles.statLabel}>Height</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Target size={18} color="#FF6B6B" />
                        <Text style={styles.statValue}>{userData?.targetWeight} {userData?.weightUnit}</Text>
                        <Text style={styles.statLabel}>Target</Text>
                    </View>
                </View>

                {/* Account Details */}
                {renderSectionHeader('ACCOUNT')}
                <View style={styles.cardList}>
                    {renderCard(Mail, 'Email Address', userAuth?.email, '#4DABF7')}
                    {renderCard(Zap, 'Fitness Level', userData?.experience, '#FFD43B')}
                </View>

                {/* Training Details */}
                {renderSectionHeader('TRAINING')}
                <View style={styles.cardList}>
                    {renderCard(Calendar, 'Frequency', `${userData?.trainingDays} days / week`, theme.colors.primary)}
                    {renderCard(MapPin, 'Location', userData?.workoutLocation, '#A5D8FF')}
                    {renderCard(Clock, 'Session Duration', `${userData?.preferred_duration} mins`, '#FCC419')}
                </View>

                {/* Nutrition Details */}
                {renderSectionHeader('NUTRITION')}
                <View style={styles.cardList}>
                    {renderCard(Utensils, 'Diet Type', userData?.dietType, '#69DB7C')}
                    {renderCard(AlertCircle, 'Allergies', userData?.allergies?.join(', ') || 'None', '#FF8787')}
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <LogOut size={20} color="#FF6B6B" style={{ marginRight: 10 }} />
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingsButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingHorizontal: theme.spacing.lg,
    },
    heroSection: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    imageWrapper: {
        position: 'relative',
        marginBottom: 16,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: theme.colors.primary,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: theme.colors.primary,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: theme.colors.background,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 4,
    },
    userGoal: {
        fontSize: 14,
        color: theme.colors.textMuted,
        fontWeight: '500',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        gap: 12,
    },
    statBox: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: theme.roundness.lg,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginTop: 8,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 11,
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.3)',
        letterSpacing: 1.5,
        marginRight: 12,
    },
    sectionLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    cardList: {
        gap: 12,
        marginBottom: 24,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: theme.roundness.lg,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
    },
    cardLabel: {
        fontSize: 12,
        color: theme.colors.textMuted,
        marginBottom: 2,
    },
    cardValue: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 107, 107, 0.05)',
        marginTop: 20,
        paddingVertical: 16,
        borderRadius: theme.roundness.lg,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 107, 0.1)',
    },
    logoutText: {
        color: '#FF6B6B',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ProfileScreen;
