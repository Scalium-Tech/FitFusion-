import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen, OnboardingScreen } from '../screens';

const Stack = createNativeStackNavigator();

const OnboardingNavigator = ({ screenProps }) => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="Welcome">
                {(props) => <WelcomeScreen {...props} setIsOnboarded={screenProps?.setIsOnboarded} />}
            </Stack.Screen>
            <Stack.Screen name="Onboarding">
                {(props) => <OnboardingScreen {...props} setIsOnboarded={screenProps?.setIsOnboarded} />}
            </Stack.Screen>
        </Stack.Navigator>
    );
};

export default OnboardingNavigator;
