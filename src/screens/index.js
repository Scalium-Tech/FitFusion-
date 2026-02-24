import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

const PlaceholderScreen = ({ name }) => (
    <View style={styles.container}>
        <Text style={styles.text}>{name} Screen</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    text: {
        ...theme.typography.h2,
        color: theme.colors.text,
    },
});

import WelcomeScreen from './onboarding/WelcomeScreen';
import OnboardingScreen from './onboarding/OnboardingScreen';

export { WelcomeScreen, OnboardingScreen };
