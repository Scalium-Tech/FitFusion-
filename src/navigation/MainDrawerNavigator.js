import React, { useState, useEffect } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import {
    Home,
    User,
    Settings,
    LogOut,
    Bell,
    HelpCircle,
    MessageSquare,
    LifeBuoy,
    FileText,
    ShieldCheck
} from 'lucide-react-native';
import MainTabNavigator from './MainTabNavigator';
import FAQScreen from '../screens/main/FAQScreen';
import TermsServicesScreen from '../screens/main/TermsServicesScreen';
import PrivacyPolicyScreen from '../screens/main/PrivacyPolicyScreen';
import FeedbackScreen from '../screens/main/FeedbackScreen';
import ContactSupportScreen from '../screens/main/ContactSupportScreen';
import HowItWorksScreen from '../screens/main/HowItWorksScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import { supabase } from '../services/supabaseClient';
import { storageService } from '../services/storageService';
import { theme } from '../theme';

const Drawer = createDrawerNavigator();

const CustomDrawerContent = (props) => {
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const loadUserData = async () => {
            const data = await storageService.getUserData();
            setUserData(data);
        };
        loadUserData();
    }, []);

    const renderDrawerItem = (icon, label, onPress) => (
        <TouchableOpacity style={styles.drawerItem} onPress={onPress}>
            {icon}
            <Text style={styles.drawerLabel}>{label}</Text>
        </TouchableOpacity>
    );

    const renderSectionHeader = (title) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
        </View>
    );

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const { error } = await supabase.auth.signOut();
                            if (error) throw error;
                        } catch (error) {
                            Alert.alert("Error", "Failed to logout. Please try again.");
                            console.error("Logout error:", error);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.drawerContainer}>
            <View style={styles.drawerHeader}>
                <View style={styles.avatarPlaceholder}>
                    <User color={theme.colors.primary} size={32} />
                </View>
                <View>
                    <Text style={styles.userName}>{userData?.name || 'User'}</Text>
                    <Text style={styles.userStatus}>
                        {userData?.subscription_tier === 'pro' ? 'Pro Member' : 'Free Member'}
                    </Text>
                </View>
            </View>

            <ScrollView style={styles.drawerItems} showsVerticalScrollIndicator={false}>
                {renderDrawerItem(<Home size={22} color={theme.colors.text} style={styles.drawerIcon} />, 'Dashboard', () => props.navigation.navigate('MainTabs', { screen: 'Home' }))}
                {renderDrawerItem(<Bell size={22} color={theme.colors.text} style={styles.drawerIcon} />, 'Notifications', () => props.navigation.navigate('Notifications'))}
                {renderDrawerItem(<HelpCircle size={22} color={theme.colors.text} style={styles.drawerIcon} />, 'How it Works', () => props.navigation.navigate('HowItWorks'))}
                {renderDrawerItem(<Settings size={22} color={theme.colors.text} style={styles.drawerIcon} />, 'Settings', () => { })}

                <View style={styles.divider} />

                {renderSectionHeader('SUPPORT')}
                {renderDrawerItem(<HelpCircle size={22} color={theme.colors.text} style={styles.drawerIcon} />, 'FAQ', () => props.navigation.navigate('FAQ'))}
                {renderDrawerItem(<MessageSquare size={22} color={theme.colors.text} style={styles.drawerIcon} />, 'Feedback', () => props.navigation.navigate('Feedback'))}
                {renderDrawerItem(<LifeBuoy size={22} color={theme.colors.text} style={styles.drawerIcon} />, 'Contact Support', () => props.navigation.navigate('ContactSupport'))}

                <View style={styles.divider} />

                {renderSectionHeader('LEGAL')}
                {renderDrawerItem(<FileText size={22} color={theme.colors.text} style={styles.drawerIcon} />, 'Terms & Services', () => props.navigation.navigate('TermsServices'))}
                {renderDrawerItem(<ShieldCheck size={22} color={theme.colors.text} style={styles.drawerIcon} />, 'Privacy Policy', () => props.navigation.navigate('PrivacyPolicy'))}

                <View style={{ height: 20 }} />
            </ScrollView>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <LogOut size={22} color="#FF4444" style={styles.drawerIcon} />
                <Text style={[styles.drawerLabel, { color: '#FF4444' }]}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
};

const MainDrawerNavigator = () => {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerShown: false,
                drawerStyle: {
                    backgroundColor: theme.colors.background,
                    width: 300,
                },
                overlayColor: 'rgba(0,0,0,0.7)',
            }}
        >
            <Drawer.Screen name="MainTabs" component={MainTabNavigator} />
            <Drawer.Screen name="FAQ" component={FAQScreen} />
            <Drawer.Screen name="TermsServices" component={TermsServicesScreen} />
            <Drawer.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Drawer.Screen name="Feedback" component={FeedbackScreen} />
            <Drawer.Screen name="ContactSupport" component={ContactSupportScreen} />
            <Drawer.Screen name="HowItWorks" component={HowItWorksScreen} />
            <Drawer.Screen name="Notifications" component={NotificationsScreen} />
        </Drawer.Navigator>
    );
};

const styles = StyleSheet.create({
    drawerContainer: {
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingTop: 60,
    },
    drawerHeader: {
        paddingHorizontal: 20,
        marginBottom: 30,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    userName: {
        color: theme.colors.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
    userStatus: {
        color: theme.colors.primary,
        fontSize: 12,
        fontWeight: '600',
    },
    drawerItems: {
        flex: 1,
    },
    sectionHeader: {
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 5,
    },
    sectionHeaderText: {
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1.5,
    },
    drawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    drawerIcon: {
        marginRight: 15,
        opacity: 0.8,
    },
    drawerLabel: {
        color: theme.colors.text,
        fontSize: 15,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginHorizontal: 20,
        marginVertical: 10,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
        paddingBottom: Platform.OS === 'android' ? 40 : 20, // Shifted up
        paddingHorizontal: 30,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
});

export default MainDrawerNavigator;
