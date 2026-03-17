import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Platform
} from 'react-native';
import { ChevronLeft, FileText } from 'lucide-react-native';
import { theme } from '../../theme';

const TermsServicesScreen = ({ navigation }) => {
    const sections = [
        {
            title: "1. Acceptance of Terms",
            content: "By accessing and using FitFusion, you agree to be bound by these Terms and Services. If you do not agree with any part of these terms, you may not use our services."
        },
        {
            title: "2. Use License",
            content: "Permission is granted to temporarily use the FitFusion app for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title."
        },
        {
            title: "3. AI Tracking & Accuracy",
            content: "FitFusion utilizes AI-based motion tracking. While we strive for high accuracy, the results are for informational purposes only. Do not rely solely on the app for medical or professional fitness advice."
        },
        {
            title: "4. User Responsibility",
            content: "Users are responsible for ensuring they are physically fit to perform exercises. FitFusion is not liable for any injuries sustained while using the app."
        },
        {
            title: "5. Privacy",
            content: "Your privacy is important to us. Please refer to our Privacy Policy for details on how we handle your data locally on your device."
        },
        {
            title: "6. Modifications",
            content: "FitFusion reserves the right to revise these terms at any time without notice. By using this app, you are agreeing to be bound by the then current version of these terms."
        }
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ChevronLeft color={theme.colors.text} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Terms & Services</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.infoBox}>
                    <FileText color={theme.colors.primary} size={40} />
                    <Text style={styles.infoTitle}>Legal Agreement</Text>
                    <Text style={styles.infoSubtitle}>Please read these terms carefully before using FitFusion.</Text>
                </View>

                {sections.map((section, index) => (
                    <View key={index} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <Text style={styles.sectionContent}>{section.content}</Text>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 15,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: theme.colors.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    infoBox: {
        alignItems: 'center',
        marginBottom: 30,
        paddingTop: 10,
    },
    infoTitle: {
        color: theme.colors.text,
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 15,
    },
    infoSubtitle: {
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        marginTop: 8,
        fontSize: 14,
        lineHeight: 20,
        paddingHorizontal: 20,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        color: theme.colors.primary,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    sectionContent: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        lineHeight: 22,
        textAlign: 'justify',
    },
});

export default TermsServicesScreen;
