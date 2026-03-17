import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabaseClient';
import { storageService } from '../services/storageService';
import OnboardingNavigator from './OnboardingNavigator';
import MainDrawerNavigator from './MainDrawerNavigator';
import { theme } from '../theme';

const RootNavigator = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isOnboarded, setIsOnboarded] = useState(false);
    const [session, setSession] = useState(null);

    useEffect(() => {
        // Capture Android camera restart intent IMMEDIATELY before async delays
        const capturePendingIntent = async () => {
            try {
                const result = await ImagePicker.getPendingResultAsync();
                if (result && result.length > 0 && !result[0].canceled) {
                    await storageService.savePendingImage(result);
                }
            } catch (err) {
                console.error("Failed to capture pending intent", err);
            }
        };
        capturePendingIntent();

        // Initial session check
        const checkSession = async () => {
            try {
                const { data: { session: currentSession } } = await supabase.auth.getSession();
                setSession(currentSession);

                if (currentSession) {
                    // Check local state first (now user-specific)
                    const onboardedStatus = await storageService.getIsOnboarded();

                    if (onboardedStatus) {
                        setIsOnboarded(true);
                    } else {
                        // verify with Supabase if local says false
                        const userData = await storageService.getUserData();
                        if (userData) {
                            setIsOnboarded(true);
                            await storageService.setIsOnboarded(true);
                        } else {
                            setIsOnboarded(false);
                        }
                    }
                } else {
                    setIsOnboarded(false);
                }
            } catch (error) {
                console.error('Session check error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            setSession(newSession);

            if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                if (newSession) {
                    // Check local state for THIS user
                    const onboarded = await storageService.getIsOnboarded();
                    if (onboarded) {
                        setIsOnboarded(true);
                    } else {
                        // Double check Supabase profile
                        const userData = await storageService.getUserData();
                        if (userData) {
                            setIsOnboarded(true);
                            await storageService.setIsOnboarded(true);
                        } else {
                            setIsOnboarded(false);
                        }
                    }
                }
            } else if (event === 'SIGNED_OUT') {
                setIsOnboarded(false);
                // No need to clear local state here as keys are user-specific,
                // but we could clear the state in storageService if we wanted to be aggressive.
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {isOnboarded && session ? (
                <MainDrawerNavigator />
            ) : (
                <OnboardingNavigator screenProps={{ setIsOnboarded }} />
            )}
        </NavigationContainer>
    );
};

export default RootNavigator;
