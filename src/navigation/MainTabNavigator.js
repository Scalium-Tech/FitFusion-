import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';
import {
    Home,
    Dumbbell,
    Layout,
    Activity,
    TrendingUp,
    MessageSquare
} from 'lucide-react-native';
import { theme } from '../theme';
import HomeScreen from '../screens/main/HomeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import MealScannerScreen from '../screens/main/MealScannerScreen';
import ChatScreen from '../screens/main/ChatScreen';
import DietScreen from '../screens/main/DietScreen';
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
            <Stack.Screen name="MealScanner" component={MealScannerScreen} />
        </Stack.Navigator>
    );
};

// Placeholder screens
const ProgressScreen = () => <View style={styles.placeholder}><Text style={styles.text}>Progress Screen</Text></View>;

const MainTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: 'rgba(16, 34, 22, 0.95)',
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(19, 236, 91, 0.1)',
                    height: Platform.OS === 'ios' ? 88 : 70,
                    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
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
                    else if (route.name === 'Tracker') IconName = Activity;
                    else if (route.name === 'Progress') IconName = TrendingUp;
                    else if (route.name === 'Chat') IconName = MessageSquare;

                    return <IconName size={24} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Home" component={HomeStack} />
            <Tab.Screen name="Workout" component={WorkoutScreen} />
            <Tab.Screen name="Diet" component={DietScreen} />
            <Tab.Screen name="Tracker" component={TrackerScreen} />
            <Tab.Screen name="Progress" component={ProgressScreen} />
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
