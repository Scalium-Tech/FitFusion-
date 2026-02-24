import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { ArrowRight, Bolt, Mail, Lock, Eye, EyeOff, User } from 'lucide-react-native';
import { supabase } from '../../services/supabaseClient';
import { storageService } from '../../services/storageService';

const { width } = Dimensions.get('window');

const WelcomeScreen = ({ navigation, setIsOnboarded }) => {
    const [view, setView] = useState('hero'); // 'hero', 'login', 'signup'
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSignIn = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                // Fetch existing user data from Supabase to sync local storage
                const userData = await storageService.getUserData();
                if (userData) {
                    await storageService.setIsOnboarded(true);
                }

                if (setIsOnboarded) {
                    setIsOnboarded(true);
                }
            }
        } catch (error) {
            Alert.alert('Login Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        if (!fullName || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                // Navigate to onboarding with the name pre-filled
                navigation.navigate('Onboarding', { name: fullName });
            }
        } catch (error) {
            Alert.alert('Sign Up Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <View style={styles.logoIcon}>
                            <Bolt size={20} color={theme.colors.background} strokeWidth={3} />
                        </View>
                        <Text style={styles.logoText}>
                            FitFusion <Text style={{ color: theme.colors.primary }}>AI</Text>
                        </Text>
                    </View>
                </View>

                {view === 'hero' && (
                    <>
                        {/* Hero Image Section */}
                        <View style={styles.heroContainer}>
                            <Image
                                source={require('../../../assets/onboarding/hero.png')}
                                style={styles.heroImage}
                                resizeMode="cover"
                            />
                            <View style={styles.overlay} />
                            <View style={styles.badge}>
                                <View style={styles.pulseDot} />
                                <Text style={styles.badgeText}>AI Engine Online</Text>
                            </View>
                        </View>

                        {/* Content Area */}
                        <View style={styles.content}>
                            <Text style={styles.title}>
                                Your AI Personal {'\n'}
                                <Text style={{ color: theme.colors.primary }}>Trainer</Text>
                            </Text>

                            <Text style={styles.subtitle}>
                                Get a personalized workout and diet plan in 60 seconds with our advanced fusion algorithm.
                            </Text>

                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={() => setView('signup')}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.primaryButtonText}>Get Started</Text>
                                    <ArrowRight size={20} color={theme.colors.background} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.secondaryButton}
                                    onPress={() => setView('login')}
                                >
                                    <Text style={styles.secondaryButtonText}>
                                        Already have an account? Sign In
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                )}

                {view === 'login' && (
                    <View style={styles.loginContent}>
                        <Text style={styles.loginTitle}>Welcome Back</Text>
                        <Text style={styles.loginSubtitle}>Sign in to continue your fitness journey</Text>

                        <View style={styles.form}>
                            <View style={styles.inputContainer}>
                                <Mail size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email Address"
                                    placeholderTextColor={theme.colors.textMuted}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Lock size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    placeholderTextColor={theme.colors.textMuted}
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    {showPassword ? (
                                        <EyeOff size={20} color={theme.colors.textMuted} />
                                    ) : (
                                        <Eye size={20} color={theme.colors.textMuted} />
                                    )}
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.primaryButton, loading && { opacity: 0.7 }]}
                                onPress={handleSignIn}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color={theme.colors.background} />
                                ) : (
                                    <>
                                        <Text style={styles.primaryButtonText}>Sign In</Text>
                                        <ArrowRight size={20} color={theme.colors.background} />
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => setView('signup')}
                            >
                                <Text style={styles.secondaryButtonText}>
                                    Don't have an account? Create One
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.secondaryButton, { marginTop: -10 }]}
                                onPress={() => setView('hero')}
                            >
                                <Text style={[styles.secondaryButtonText, { color: theme.colors.primary }]}>
                                    Back to Home
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {view === 'signup' && (
                    <View style={styles.loginContent}>
                        <Text style={styles.loginTitle}>Create Account</Text>
                        <Text style={styles.loginSubtitle}>Start your AI transformation today</Text>

                        <View style={styles.form}>
                            <View style={styles.inputContainer}>
                                <User size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Full Name"
                                    placeholderTextColor={theme.colors.textMuted}
                                    value={fullName}
                                    onChangeText={setFullName}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Mail size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email Address"
                                    placeholderTextColor={theme.colors.textMuted}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Lock size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    placeholderTextColor={theme.colors.textMuted}
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    {showPassword ? (
                                        <EyeOff size={20} color={theme.colors.textMuted} />
                                    ) : (
                                        <Eye size={20} color={theme.colors.textMuted} />
                                    )}
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.primaryButton, loading && { opacity: 0.7 }]}
                                onPress={handleSignUp}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color={theme.colors.background} />
                                ) : (
                                    <>
                                        <Text style={styles.primaryButtonText}>Create Account</Text>
                                        <ArrowRight size={20} color={theme.colors.background} />
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => setView('login')}
                            >
                                <Text style={styles.secondaryButtonText}>
                                    Already have an account? Sign In
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.secondaryButton, { marginTop: -10 }]}
                                onPress={() => setView('hero')}
                            >
                                <Text style={[styles.secondaryButtonText, { color: theme.colors.primary }]}>
                                    Back to Home
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Footer Info */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>© 2024 FitFusion AI. Performance Redefined.</Text>
                </View>
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
        flexGrow: 1,
    },
    header: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logoIcon: {
        backgroundColor: theme.colors.primary,
        borderRadius: 8,
        padding: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    heroContainer: {
        width: width - (theme.spacing.lg * 2),
        height: 350,
        alignSelf: 'center',
        borderRadius: theme.roundness.xl,
        overflow: 'hidden',
        position: 'relative',
        marginTop: theme.spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.1)',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(16, 34, 22, 0.3)', // Dark overlay
    },
    badge: {
        position: 'absolute',
        top: 16,
        left: 16,
        backgroundColor: 'rgba(16, 34, 22, 0.8)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.2)',
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.primary,
    },
    badgeText: {
        color: '#e2e8f0',
        fontSize: 10,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xl,
        paddingTop: theme.spacing.xl,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: theme.colors.text,
        textAlign: 'center',
        lineHeight: 44,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.textMuted,
        textAlign: 'center',
        marginTop: theme.spacing.md,
        lineHeight: 24,
    },
    buttonContainer: {
        width: '100%',
        marginTop: theme.spacing.xl,
        gap: 12,
    },
    primaryButton: {
        backgroundColor: theme.colors.primary,
        height: 56,
        borderRadius: theme.roundness.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    primaryButtonText: {
        color: theme.colors.background,
        fontSize: 18,
        fontWeight: 'bold',
    },
    secondaryButton: {
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        color: theme.colors.textMuted,
        fontSize: 14,
        fontWeight: '600',
    },
    footer: {
        paddingBottom: theme.spacing.lg,
        alignItems: 'center',
    },
    footerText: {
        color: 'rgba(148, 163, 184, 0.3)',
        fontSize: 12,
    },
    loginContent: {
        flex: 1,
        paddingHorizontal: theme.spacing.xl,
        paddingTop: 40,
    },
    loginTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 8,
    },
    loginSubtitle: {
        fontSize: 16,
        color: theme.colors.textMuted,
        marginBottom: 32,
    },
    form: {
        gap: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: theme.roundness.lg,
        height: 56,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: theme.colors.text,
        fontSize: 16,
    },
});

export default WelcomeScreen;
