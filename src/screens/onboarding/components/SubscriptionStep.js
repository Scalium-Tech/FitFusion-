import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    SafeAreaView,
    Platform,
    ScrollView
} from 'react-native';
import { CheckCircle2, Clock, X, Dumbbell } from 'lucide-react-native';
import { theme } from '../../../theme';

const { width, height } = Dimensions.get('window');

const SubscriptionStep = ({ onNext, navigation }) => {
    const [selectedPlan, setSelectedPlan] = useState('annual');

    const renderPlanCard = (id, title, subtitle, badgeText, features, isPrimary = false) => {
        const isSelected = selectedPlan === id;

        return (
            <TouchableOpacity
                style={[
                    styles.planCard,
                    isSelected && styles.planCardSelected
                ]}
                activeOpacity={0.8}
                onPress={() => setSelectedPlan(id)}
            >
                <View style={styles.planHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.planTitle}>{title}</Text>
                        {subtitle ? <Text style={styles.planSubtitle}>{subtitle}</Text> : null}
                    </View>
                    {badgeText ? (
                        <View style={styles.badgeContainer}>
                            <Text style={styles.badgeText}>{badgeText}</Text>
                        </View>
                    ) : null}
                </View>

                <View style={styles.featuresListContainer}>
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <View key={index} style={styles.featureItem}>
                                <Icon size={14} color={isPrimary ? theme.colors.primary : 'rgba(255,255,255,0.6)'} />
                                <Text style={[
                                    styles.featureTextSecondary,
                                    isPrimary && styles.featureTextPrimary
                                ]}>{feature.text}</Text>
                            </View>
                        );
                    })}
                </View>
            </TouchableOpacity>
        );
    };

    const premiumFeatures = [
        { icon: CheckCircle2, text: 'Full AI Workout Personalization' },
        { icon: CheckCircle2, text: 'Smart Nutrition & Diet Plans' },
        { icon: CheckCircle2, text: 'Real-time Form Correction' },
        { icon: CheckCircle2, text: 'Advanced Progress Analytics' },
        { icon: CheckCircle2, text: '24/7 AI Fitness Coach Access' },
    ];

    const trialFeatures = [
        { icon: Dumbbell, text: '3 Days of Full Access' },
        { icon: Dumbbell, text: 'Try All Premium Features' },
        { icon: Dumbbell, text: 'No Credit Card Required' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.softGradientOverlay} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.illustrationContainer}>
                        <View style={styles.glowEffect} />
                        <View style={styles.iconCircle}>
                            <Dumbbell size={64} color={theme.colors.primary} strokeWidth={1.5} />
                        </View>
                    </View>
                    <Text style={styles.title}>Start Your Fitness Journey</Text>
                    <Text style={styles.subtitle}>Unlock personalized AI workout and diet plans.</Text>
                </View>

                {/* Pricing Options */}
                <View style={styles.pricingContainer}>

                    {/* Option 1: Annual */}
                    {renderPlanCard(
                        'annual',
                        '₹2 Annual Plan',
                        '₹0.16/month • Billed yearly',
                        'BEST VALUE',
                        premiumFeatures,
                        true
                    )}

                    {/* Option 2: Monthly */}
                    {renderPlanCard(
                        'monthly',
                        '₹1 Monthly Plan',
                        'Billed monthly',
                        null,
                        premiumFeatures
                    )}

                    {/* Option 3: Free Plan */}
                    {renderPlanCard(
                        'free',
                        '3-Day Free Trial',
                        'Try all features for free',
                        'NEW',
                        trialFeatures
                    )}

                </View>

                {/* Footer Action */}
                <View style={styles.footerAction}>
                    <TouchableOpacity
                        style={styles.ctaButton}
                        onPress={() => onNext(selectedPlan !== 'free', selectedPlan)}
                    >
                        <Text style={styles.ctaButtonText}>
                            {selectedPlan === 'free' ? 'Start Your Free Trial' : 'Subscribe Now'}
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.disclaimerText}>
                        {selectedPlan === 'free'
                            ? "By tapping 'Start Your Free Trial', you'll get 3 days of full access. No automatic charges."
                            : `By tapping 'Subscribe Now', you will be charged ${selectedPlan === 'annual' ? '₹2 yearly' : '₹1 monthly'}. Cancel anytime in App Store settings.`
                        }
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background || '#0a0a0a',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    softGradientOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(19, 236, 91, 0.05)',
        opacity: 0.5,
    },
    heroSection: {
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingTop: Platform.OS === 'ios' ? 60 : 80,
        paddingBottom: 30,
        zIndex: 10,
    },
    illustrationContainer: {
        width: 100,
        height: 100,
        marginBottom: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    glowEffect: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(19, 236, 91, 0.15)',
        borderRadius: 100,
        transform: [{ scale: 1.5 }],
    },
    iconCircle: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
        backgroundColor: 'rgba(19, 236, 91, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.2)',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 30,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        paddingHorizontal: 8,
    },
    pricingContainer: {
        paddingHorizontal: 20,
        gap: 16,
        zIndex: 10,
    },
    planCard: {
        padding: 16,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    planCardSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: 'rgba(19, 236, 91, 0.04)',
        borderWidth: 2,
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    planTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    planSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 2,
    },
    badgeContainer: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#000000',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    featuresListContainer: {
        gap: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    featureTextPrimary: {
        fontSize: 13,
        color: 'rgba(19, 236, 91, 0.9)',
        fontWeight: '500',
    },
    featureTextSecondary: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '400',
    },
    footerAction: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 60 : 80,
        alignItems: 'center',
        gap: 16,
        zIndex: 10,
    },
    ctaButton: {
        width: '100%',
        paddingVertical: 16,
        paddingHorizontal: 32,
        backgroundColor: theme.colors.primary,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    ctaButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000000',
    },
    disclaimerText: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'center',
        lineHeight: 16,
        paddingHorizontal: 16,
    }
});

export default SubscriptionStep;
