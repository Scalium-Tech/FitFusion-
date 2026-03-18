import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
    Home,
    Dumbbell,
    Layout,
    Activity,
    MessageSquare,
    TrendingUp,
    Crosshair
} from 'lucide-react-native';
import { theme } from '../theme';
import HomeScreen from '../screens/main/HomeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import SubscriptionScreen from '../screens/main/SubscriptionScreen';
import MealScannerScreen from '../screens/main/MealScannerScreen';
import ChatScreen from '../screens/main/ChatScreen';
import DietScreen from '../screens/main/DietScreen';
import WorkoutTrackingScreen from '../screens/main/WorkoutTrackingScreen';
import WorkoutScreen from '../screens/main/WorkoutScreen';
import TrackerScreen from '../screens/main/TrackerScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Home Stack for Profile navigation
const HomeStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Dashboard" component={HomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Subscription" component={SubscriptionScreen} />
            <Stack.Screen name="MealScanner" component={MealScannerScreen} />
        </Stack.Navigator>
    );
};

// Placeholder screens

const MainTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: 'rgba(16, 34, 22, 0.95)',
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(19, 236, 91, 0.1)',
                    height: Platform.OS === 'ios' ? 95 : 85, // Increased height to accommodate padding
                    paddingBottom: Platform.OS === 'ios' ? 35 : 22, // Lifted icons up
                    paddingTop: 12,
                    position: 'absolute',
                    elevation: 0,
                },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.4)',
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '600',
                    marginTop: 4,
                },
                tabBarIcon: ({ color, size }) => {
                    let IconName;
                    if (route.name === 'Home') IconName = Home;
                    else if (route.name === 'Workout') IconName = Dumbbell;
                    else if (route.name === 'Diet') IconName = Layout;
                    else if (route.name === 'Tracking') IconName = Crosshair; // Using Crosshair for live tracking
                    else if (route.name === 'Tracker') IconName = Activity; // Keep Activity for progress
                    else if (route.name === 'Chat') IconName = MessageSquare;

                    return <IconName size={24} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Home" component={HomeStack} />
            <Tab.Screen name="Workout" component={WorkoutScreen} />
            <Tab.Screen name="Diet" component={DietScreen} />
            <Tab.Screen name="Tracking" component={WorkoutTrackingScreen} />
            <Tab.Screen name="Tracker" component={TrackerScreen} />
            <Tab.Screen name="Chat" component={ChatScreen} />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    placeholder: {
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: theme.colors.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default MainTabNavigator;
