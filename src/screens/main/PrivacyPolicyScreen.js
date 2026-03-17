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
import { ChevronLeft, ShieldCheck } from 'lucide-react-native';
import { theme } from '../../theme';

const PrivacyPolicyScreen = ({ navigation }) => {
    const sections = [
        {
            title: "1. Data Collection",
            content: "FitFusion is designed with privacy in mind. We minimize data collection and prioritize local processing. Personal data such as age, weight, and fitness goals are stored securely on your device or in your private account."
        },
        {
            title: "2. Camera & AI Processing",
            content: "The AI motion tracking feature uses your device's camera for real-time analysis. Crucially, video feeds are processed locally on your device's CPU/GPU. We do not record, store, or transmit video or image data to our servers or any third parties."
        },
        {
            title: "3. Health Data",
            content: "Workout statistics and progress data are used solely to provide you with insights and updated workout plans. This data is kept private and is not shared with advertisers."
        },
        {
            title: "4. Third-Party Services",
            content: "We use Supabase for authentication and secure data storage. These services adhere to strict security standards to protect your account information."
        },
        {
            title: "5. Your Rights",
            content: "You have the right to access, update, or delete your personal data at any time through the app settings. Feel free to contact our support for any privacy-related inquiries."
        },
        {
            title: "6. Policy Updates",
            content: "We may update this policy periodically. We will notify you of any significant changes through the app."
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
                <Text style={styles.headerTitle}>Privacy Policy</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.infoBox}>
                    <ShieldCheck color={theme.colors.primary} size={40} />
                    <Text style={styles.infoTitle}>Your Privacy Matters</Text>
                    <Text style={styles.infoSubtitle}>Learn how we protect your data and prioritize your privacy at FitFusion.</Text>
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

export default PrivacyPolicyScreen;
