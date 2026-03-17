import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Platform,
    Image
} from 'react-native';
import { ChevronLeft, Zap, Target, BarChart3, Camera, Play, CheckCircle2, UtensilsCrossed, MessageSquare } from 'lucide-react-native';
import { theme } from '../../theme';

const STEPS = [
    {
        id: 'scan',
        title: 'AI Body Scanning',
        description: 'We analyze your posture and movements using your camera to create a precise physical baseline.',
        icon: Camera,
        color: '#13EC5B'
    },
    {
        id: 'plans',
        title: 'Workout & Diet Plans',
        description: 'Get perfectly tailored workout and nutrition plans based on your goals, health conditions, and preferences.',
        icon: Target,
        color: '#1E90FF'
    },
    {
        id: 'track',
        title: 'Live Form Tracking',
        description: 'Exercise with confidence as our AI monitors your form in real-time, correcting mistakes and counting reps.',
        icon: Play,
        color: '#FF4B4B'
    },
    {
        id: 'meal',
        title: 'AI Meal Scanning',
        description: 'Simply snap a photo of your meal to instantly track calories, macros, and get nutritional insights.',
        icon: UtensilsCrossed,
        color: '#F9D423'
    },
    {
        id: 'chat',
        title: 'AI Fitness Chat',
        description: 'Your 24/7 fitness companion is ready to answer questions, provide motivation, and offer expert advice.',
        icon: MessageSquare,
        color: '#A855F7'
    },
    {
        id: 'analyze',
        title: 'Progress Tracker',
        description: 'See the big picture with detailed analytics covering your workouts, nutrition, and physical transformation.',
        icon: BarChart3,
        color: '#06B6D4'
    }
];

const HowItWorksScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ChevronLeft color={theme.colors.text} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>How it Works</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.heroSection}>
                    <View style={styles.heroImageContainer}>
                        <Image
                            source={require('../../../assets/ai_fitness_coach_concept_1773745692420.png')}
                            style={styles.heroImage}
                            resizeMode="cover"
                        />
                        <View style={styles.heroOverlay} />
                    </View>
                    <Text style={styles.heroTitle}>Master Your Fitness with AI</Text>
                    <Text style={styles.heroSubtitle}>
                        FitFusion AI combines advanced computer vision with personalized coaching to transform your workout experience.
                    </Text>
                </View>

                <View style={styles.stepsSection}>
                    {STEPS.map((step, index) => {
                        const Icon = step.icon;
                        return (
                            <View key={step.id} style={styles.stepCard}>
                                <View style={styles.stepHeader}>
                                    <View style={[styles.iconContainer, { backgroundColor: `${step.color}15` }]}>
                                        <Icon size={24} color={step.color} />
                                    </View>
                                    <View style={styles.stepNumber}>
                                        <Text style={styles.stepNumberText}>0{index + 1}</Text>
                                    </View>
                                </     View>
                                <View style={styles.stepBody}>
                                    <Text style={styles.stepTitle}>{step.title}</Text>
                                    <Text style={styles.stepDescription}>{step.description}</Text>
                                </View>
                                {index < STEPS.length - 1 && (
                                    <View style={styles.connector} />
                                )}
                            </View>
                        );
                    })}
                </View>

                <View style={styles.benefitsSection}>
                    <Text style={styles.benefitsTitle}>Why Choose FitFusion?</Text>
                    <View style={styles.benefitsGrid}>
                        <View style={styles.benefitItem}>
                            <CheckCircle2 size={18} color={theme.colors.primary} />
                            <Text style={styles.benefitText}>No expensive gear needed</Text>
                        </View>
                        <View style={styles.benefitItem}>
                            <CheckCircle2 size={18} color={theme.colors.primary} />
                            <Text style={styles.benefitText}>Prevent injuries with form AI</Text>
                        </View>
                        <View style={styles.benefitItem}>
                            <CheckCircle2 size={18} color={theme.colors.primary} />
                            <Text style={styles.benefitText}>Train anytime, anywhere</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.ctaButton}
                    onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
                >
                    <Text style={styles.ctaButtonText}>Get Started Now</Text>
                </TouchableOpacity>

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
    scrollContent: {
        padding: 20,
    },
    heroSection: {
        alignItems: 'center',
        paddingVertical: 10,
        marginBottom: 20,
    },
    heroImageContainer: {
        width: '100%',
        height: 200,
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 24,
        position: 'relative',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    heroTitle: {
        color: theme.colors.text,
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    heroSubtitle: {
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        fontSize: 15,
        lineHeight: 24,
        paddingHorizontal: 10,
    },
    stepsSection: {
        paddingHorizontal: 10,
    },
    stepCard: {
        marginBottom: 10,
        position: 'relative',
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumber: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    stepNumberText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
        fontWeight: 'bold',
    },
    stepBody: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    stepTitle: {
        color: theme.colors.text,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    stepDescription: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        lineHeight: 22,
    },
    connector: {
        width: 2,
        height: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignSelf: 'center',
        marginTop: 10,
    },
    benefitsSection: {
        marginTop: 40,
        padding: 20,
        backgroundColor: 'rgba(19, 236, 91, 0.05)',
        borderRadius: 24,
        marginBottom: 30,
    },
    benefitsTitle: {
        color: theme.colors.text,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    benefitsGrid: {
        gap: 12,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    benefitText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
    },
    ctaButton: {
        backgroundColor: theme.colors.primary,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    ctaButtonText: {
        color: theme.colors.background,
        fontSize: 16,
        fontWeight: 'bold',
    },
    footerSpacer: {
        height: 40,
    }
});

export default HowItWorksScreen;
