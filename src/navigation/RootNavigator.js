import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { supabase } from '../services/supabaseClient';
import { storageService } from '../services/storageService';
import OnboardingNavigator from './OnboardingNavigator';
import MainTabNavigator from './MainTabNavigator';
import { theme } from '../theme';

const RootNavigator = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isOnboarded, setIsOnboarded] = useState(false);
    const [session, setSession] = useState(null);

    useEffect(() => {
        // Initial session check
        const checkSession = async () => {
            try {
                const [sessionResult, onboardedStatus] = await Promise.all([
                    supabase.auth.getSession(),
                    storageService.getIsOnboarded()
                ]);

                setSession(sessionResult.data.session);
                setIsOnboarded(onboardedStatus);

                // As a fallback, if we have a session but local onboarded is false, check Supabase
                if (sessionResult.data.session && !onboardedStatus) {
                    const userData = await storageService.getUserData();
                    if (userData) {
                        setIsOnboarded(true);
                        await storageService.setIsOnboarded(true);
                    }
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
                const onboarded = await storageService.getIsOnboarded();
                if (onboarded) {
                    setIsOnboarded(true);
                } else {
                    const userData = await storageService.getUserData();
                    if (userData) {
                        setIsOnboarded(true);
                        await storageService.setIsOnboarded(true);
                    }
                }
            } else if (event === 'SIGNED_OUT') {
                setIsOnboarded(false);
                await storageService.setIsOnboarded(false);
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
                <MainTabNavigator />
            ) : (
                <OnboardingNavigator screenProps={{ setIsOnboarded }} />
            )}
        </NavigationContainer>
    );
};

export default RootNavigator;
