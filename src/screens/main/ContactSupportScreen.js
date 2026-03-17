import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Platform,
    Linking,
    TextInput,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
    Alert,
    ActivityIndicator
} from 'react-native';
import { ChevronLeft, LifeBuoy, Mail, MessageCircle, Phone, Globe, ExternalLink, Send, ChevronDown } from 'lucide-react-native';
import { theme } from '../../theme';
import { storageService } from '../../services/storageService';

const SUBJECT_OPTIONS = [
    'Technical Issue',
    'Billing & Subscription',
    'Workout Plan Question',
    'AI Coach Feedback',
    'Other'
];

const ContactSupportScreen = ({ navigation }) => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSubjectPicker, setShowSubjectPicker] = useState(false);

    const contactMethods = [
        {
            id: 'email',
            title: 'Email Support',
            value: 'support@fitfusion.ai',
            icon: Mail,
            color: '#FF4B4B',
            onPress: () => Linking.openURL('mailto:support@fitfusion.ai')
        },
        {
            id: 'whatsapp',
            title: 'WhatsApp Chat',
            value: '+91 9136328031',
            icon: MessageCircle,
            color: '#25D366',
            onPress: () => Linking.openURL('https://wa.me/919136328031')
        }
    ];

    const handleSubmitTicket = async () => {
        if (!subject) {
            Alert.alert('Selection Required', 'Please select a subject for your ticket.');
            return;
        }
        if (message.trim().length < 10) {
            Alert.alert('Message Too Short', 'Please provide a bit more detail about your issue.');
            return;
        }

        setIsSubmitting(true);
        try {
            await storageService.saveSupportTicket({
                subject,
                message
            });
            Alert.alert(
                'Ticket Submitted',
                'Your support ticket has been sent successfully. Our team will get back to you shortly.',
                [{
                    text: 'Great', onPress: () => {
                        setSubject('');
                        setMessage('');
                        navigation.goBack();
                    }
                }]
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to submit ticket. Please check your internet connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderContactCard = (item) => {
        const Icon = item.icon;
        return (
            <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={item.onPress}
            >
                <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
                    <Icon size={24} color={item.color} />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardValue}>{item.value}</Text>
                </View>
                <ExternalLink size={16} color="rgba(255,255,255,0.2)" />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={{ flex: 1 }}>
                        <View style={styles.header}>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => navigation.goBack()}
                            >
                                <ChevronLeft color={theme.colors.text} size={28} />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>Contact Support</Text>
                            <View style={{ width: 40 }} />
                        </View>

                        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                            <View style={styles.heroSection}>
                                <View style={styles.iconCircle}>
                                    <LifeBuoy color={theme.colors.primary} size={48} />
                                </View>
                                <Text style={styles.heroTitle}>How can we help?</Text>
                                <Text style={styles.heroSubtitle}>
                                    Our team usually responds within 2 hours during business days.
                                </Text>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Submit a Ticket</Text>
                                <View style={styles.formContainer}>
                                    {/* Subject Picker */}
                                    <TouchableOpacity
                                        style={styles.pickerButton}
                                        onPress={() => setShowSubjectPicker(!showSubjectPicker)}
                                    >
                                        <Text style={[styles.pickerText, !subject && styles.placeholderText]}>
                                            {subject || 'Select Subject'}
                                        </Text>
                                        <ChevronDown size={20} color={theme.colors.text} style={{ opacity: 0.5 }} />
                                    </TouchableOpacity>

                                    {showSubjectPicker && (
                                        <View style={styles.pickerDropdown}>
                                            {SUBJECT_OPTIONS.map((option) => (
                                                <TouchableOpacity
                                                    key={option}
                                                    style={styles.pickerOption}
                                                    onPress={() => {
                                                        setSubject(option);
                                                        setShowSubjectPicker(false);
                                                    }}
                                                >
                                                    <Text style={[styles.optionText, subject === option && styles.optionTextActive]}>
                                                        {option}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}

                                    {/* Message Input */}
                                    <TextInput
                                        style={styles.messageInput}
                                        placeholder="Tell us what's happening..."
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                        multiline
                                        numberOfLines={5}
                                        value={message}
                                        onChangeText={setMessage}
                                        textAlignVertical="top"
                                    />

                                    <TouchableOpacity
                                        style={[styles.submitButton, (isSubmitting || !subject || !message) && styles.submitButtonDisabled]}
                                        onPress={handleSubmitTicket}
                                        disabled={isSubmitting || !subject || !message}
                                    >
                                        {isSubmitting ? (
                                            <ActivityIndicator color={theme.colors.background} />
                                        ) : (
                                            <>
                                                <Text style={styles.submitButtonText}>Send Request</Text>
                                                <Send size={18} color={theme.colors.background} style={{ marginLeft: 8 }} />
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Quick Contact</Text>
                                <View style={styles.contactRow}>
                                    {contactMethods.map(renderContactCard)}
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.faqLink}
                                onPress={() => navigation.navigate('FAQ')}
                            >
                                <Globe size={18} color={theme.colors.primary} />
                                <Text style={styles.faqLinkText}>Check our FAQs first</Text>
                                <ExternalLink size={14} color="rgba(255,255,255,0.3)" />
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
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
    },
    heroSection: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    heroTitle: {
        color: theme.colors.text,
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    heroSubtitle: {
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 20,
        paddingHorizontal: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    contactRow: {
        gap: 10,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardInfo: {
        flex: 1,
    },
    cardTitle: {
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: '600',
    },
    cardValue: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        marginTop: 2,
    },
    formContainer: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    pickerButton: {
        height: 50,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    pickerText: {
        color: theme.colors.text,
        fontSize: 14,
    },
    placeholderText: {
        color: 'rgba(255,255,255,0.3)',
    },
    pickerDropdown: {
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        marginBottom: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    pickerOption: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    optionText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
    },
    optionTextActive: {
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    messageInput: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        padding: 16,
        color: theme.colors.text,
        fontSize: 14,
        minHeight: 120,
        marginBottom: 16,
    },
    submitButton: {
        height: 50,
        backgroundColor: theme.colors.primary,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: theme.colors.background,
        fontSize: 15,
        fontWeight: 'bold',
    },
    faqLink: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(19, 236, 91, 0.05)',
        borderRadius: 12,
        padding: 15,
        gap: 10,
        marginBottom: 30,
    },
    faqLinkText: {
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
});

export default ContactSupportScreen;
