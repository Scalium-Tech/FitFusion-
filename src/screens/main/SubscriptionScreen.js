import React from 'react';
import { StyleSheet, View, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import SubscriptionStep from '../onboarding/components/SubscriptionStep';
import { theme } from '../../theme';
import { storageService } from '../../services/storageService';

const SubscriptionScreen = ({ navigation }) => {
    const handleSubscriptionComplete = async (success, selectedPlan) => {
        try {
            const userData = await storageService.getUserData();
            const updatedUserData = {
                ...userData,
                is_subscribed: success,
                subscription_tier: selectedPlan
            };
            await storageService.saveUserData(updatedUserData);
            navigation.goBack();
        } catch (error) {
            console.error('[SubscriptionScreen] Error updating subscription:', error);
            navigation.goBack();
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ChevronLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
            </SafeAreaView>
            <SubscriptionStep onNext={handleSubscriptionComplete} navigation={navigation} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 10 : 30,
        left: 20,
        zIndex: 100,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default SubscriptionScreen;
