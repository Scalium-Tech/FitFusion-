import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    SafeAreaView,
    Platform
} from 'react-native';
import { CheckCircle2, Clock, X, Dumbbell } from 'lucide-react-native';
import { theme } from '../../../theme';

const { width, height } = Dimensions.get('window');

const SubscriptionStep = ({ onNext, navigation }) => {
    const [selectedPlan, setSelectedPlan] = useState('annual');

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.softGradientOverlay} />

            <View style={styles.softGradientOverlay} />

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
                <TouchableOpacity
                    style={[
                        styles.planCard,
                        selectedPlan === 'annual' && styles.planCardSelected
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedPlan('annual')}
                >
                    <View style={styles.planHeader}>
                        <View>
                            <Text style={styles.planTitle}>₹1499 Annual Plan</Text>
                            <Text style={styles.planSubtitle}>₹125/month • Billed yearly</Text>
                        </View>
                        <View style={styles.badgeContainer}>
                            <Text style={styles.badgeText}>BEST VALUE</Text>
                        </View>
                    </View>
                    <View style={styles.featuresList}>
                        <CheckCircle2 size={16} color={theme.colors.primary} />
                        <Text style={styles.featureTextPrimary}>3-Day Free Trial included</Text>
                    </View>
                </TouchableOpacity>

                {/* Option 2: Monthly */}
                <TouchableOpacity
                    style={[
                        styles.planCard,
                        selectedPlan === 'monthly' && styles.planCardSelected
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedPlan('monthly')}
                >
                    <View style={styles.planHeader}>
                        <View>
                            <Text style={styles.planTitle}>₹199 Monthly Plan</Text>
                        </View>
                    </View>
                    <View style={styles.featuresList}>
                        <Clock size={16} color={theme.colors.text.secondary} />
                        <Text style={styles.featureTextSecondary}>3-Day Free Trial</Text>
                    </View>
                </TouchableOpacity>

            </View>

            {/* Footer Action */}
            <View style={styles.footerAction}>
                <TouchableOpacity
                    style={styles.ctaButton}
                    onPress={() => onNext(true, selectedPlan)}
                >
                    <Text style={styles.ctaButtonText}>Start Your Free Trial</Text>
                </TouchableOpacity>
                <Text style={styles.disclaimerText}>
                    By tapping 'Start Your Free Trial', you will be charged {selectedPlan === 'annual' ? '₹1499 yearly' : '₹199 monthly'} after 3 days. Cancel anytime in App Store settings.
                </Text>
            </View>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background || '#0a0a0a',
    },
    softGradientOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(19, 236, 91, 0.05)',
        // Simulating the CSS radial gradients
        opacity: 0.5,
    },
    heroSection: {
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingTop: Platform.OS === 'ios' ? 40 : 60,
        paddingBottom: 40,
        zIndex: 10,
    },
    illustrationContainer: {
        width: 140,
        height: 140,
        marginBottom: 32,
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
        borderRadius: 70,
        backgroundColor: 'rgba(19, 236, 91, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.2)',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 34,
    },
    subtitle: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        paddingHorizontal: 8,
    },
    pricingContainer: {
        flex: 1,
        paddingHorizontal: 24,
        gap: 16,
        zIndex: 10,
    },
    planCard: {
        padding: 20,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    planCardSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: 'rgba(19, 236, 91, 0.05)',
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    planTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    planSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
    },
    badgeContainer: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#000000',
        letterSpacing: 0.5,
    },
    featuresList: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        gap: 8,
    },
    featureTextPrimary: {
        fontSize: 14,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    featureTextSecondary: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '500',
    },
    footerAction: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        alignItems: 'center',
        gap: 16,
        zIndex: 10,
    },
    ctaButton: {
        width: '100%',
        paddingVertical: 20,
        paddingHorizontal: 32,
        backgroundColor: theme.colors.primary,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    ctaButtonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000000',
    },
    disclaimerText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        lineHeight: 18,
        paddingHorizontal: 16,
    }
});

export default SubscriptionStep;
