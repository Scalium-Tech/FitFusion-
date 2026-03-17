import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    LayoutAnimation,
    Platform,
    UIManager
} from 'react-native';
import { ChevronDown, ChevronUp, ChevronLeft, HelpCircle } from 'lucide-react-native';
import { theme } from '../../theme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQScreen = ({ navigation }) => {
    const [expandedId, setExpandedId] = useState(null);

    const faqs = [
        {
            id: 1,
            question: "How does the AI tracking work?",
            answer: "Our AI uses your device's camera to analyze your skeletal posture in real-time. It measures joint angles to ensure your form is perfect and counts repetitions automatically."
        },
        {
            id: 2,
            question: "Is my camera data stored?",
            answer: "No. All AI processing happens locally on your device. We never record, store, or transmit any video or image data to our servers."
        },
        {
            id: 3,
            question: "How do I get a custom workout plan?",
            answer: "Go to the Workout tab and tell our AI Assistant your goals, available equipment, and fitness level. It will generate a tailored plan just for you."
        },
        {
            id: 4,
            question: "Can I use the app offline?",
            answer: "The AI tracker works offline once the model is downloaded. However, you'll need an internet connection to sync your progress and generate new AI plans."
        },
        {
            id: 5,
            question: "How do I update my profile?",
            answer: "Navigate to the Profile tab from the bottom menu. There you can update your physical stats, goals, and personal information."
        }
    ];

    const toggleExpand = (id) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ChevronLeft color={theme.colors.text} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>FAQ</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.infoBox}>
                    <HelpCircle color={theme.colors.primary} size={40} />
                    <Text style={styles.infoTitle}>How can we help?</Text>
                    <Text style={styles.infoSubtitle}>Find answers to the most common questions about FitFusion.</Text>
                </View>

                {faqs.map((faq) => (
                    <TouchableOpacity
                        key={faq.id}
                        style={[
                            styles.faqItem,
                            expandedId === faq.id && styles.faqItemExpanded
                        ]}
                        onPress={() => toggleExpand(faq.id)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.questionRow}>
                            <Text style={styles.questionText}>{faq.question}</Text>
                            {expandedId === faq.id ? (
                                <ChevronUp color={theme.colors.primary} size={20} />
                            ) : (
                                <ChevronDown color="rgba(255,255,255,0.3)" size={20} />
                            )}
                        </View>
                        {expandedId === faq.id && (
                            <View style={styles.answerContainer}>
                                <Text style={styles.answerText}>{faq.answer}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
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
        paddingTop: Platform.OS === 'android' ? 40 : 15, // Shifted down for better visibility
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
    faqItem: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    faqItemExpanded: {
        borderColor: 'rgba(19, 236, 91, 0.2)',
        backgroundColor: 'rgba(19, 236, 91, 0.02)',
    },
    questionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    questionText: {
        color: theme.colors.text,
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
        marginRight: 10,
    },
    answerContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    answerText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        lineHeight: 22,
    },
});

export default FAQScreen;
