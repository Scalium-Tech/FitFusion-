import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    SafeAreaView,
    Platform,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
    Alert
} from 'react-native';
import { ChevronLeft, MessageSquare, Star, Send, Bug, Zap, LifeBuoy, HelpCircle, CheckCircle2 } from 'lucide-react-native';
import { theme } from '../../theme';
import { storageService } from '../../services/storageService';

const CATEGORIES = [
    { id: 'bug', label: 'Bug Report', icon: Bug },
    { id: 'feature', label: 'Feature Request', icon: Zap },
    { id: 'support', label: 'Support', icon: LifeBuoy },
    { id: 'general', label: 'General', icon: HelpCircle },
];

const AREAS = [
    { id: 'ai', label: 'AI Coach' },
    { id: 'workout', label: 'Workout Plan' },
    { id: 'nutrition', label: 'Nutrition' },
    { id: 'design', label: 'UI Design' },
];

const MAX_CHARS = 500;

const FeedbackScreen = ({ navigation }) => {
    const [rating, setRating] = useState(0);
    const [category, setCategory] = useState('general');
    const [selectedAreas, setSelectedAreas] = useState([]);
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggleArea = (id) => {
        setSelectedAreas(prev =>
            prev.includes(id) ? prev.filter(areaId => areaId !== id) : [...prev, id]
        );
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert("Feedback", "Please select a rating before submitting.");
            return;
        }

        if (feedback.trim().length < 10) {
            Alert.alert("Feedback", "Please provide a bit more detail (at least 10 characters).");
            return;
        }

        setIsSubmitting(true);

        try {
            await storageService.saveFeedback({
                rating,
                category,
                areas: selectedAreas,
                feedback
            });

            Alert.alert(
                "Feedback Received",
                "Thank you for helping us improve FitFusion!",
                [{ text: "OK", onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            Alert.alert("Error", "Failed to send feedback. Please try again later.");
        } finally {
            setIsSubmitting(false);
        }
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
                            <Text style={styles.headerTitle}>Feedback</Text>
                            <View style={{ width: 40 }} />
                        </View>

                        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                            <View style={styles.infoBox}>
                                <MessageSquare color={theme.colors.primary} size={40} />
                                <Text style={styles.infoTitle}>Your Voice Matters</Text>
                                <Text style={styles.infoSubtitle}>How would you rate your experience with FitFusion AI?</Text>
                            </View>

                            <View style={styles.ratingContainer}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity
                                        key={star}
                                        onPress={() => setRating(star)}
                                        style={styles.starButton}
                                    >
                                        <Star
                                            size={44}
                                            color={star <= rating ? theme.colors.primary : 'rgba(255,255,255,0.1)'}
                                            fill={star <= rating ? theme.colors.primary : 'transparent'}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Category</Text>
                                <View style={styles.categoryGrid}>
                                    {CATEGORIES.map((item) => {
                                        const Icon = item.icon;
                                        const isSelected = category === item.id;
                                        return (
                                            <TouchableOpacity
                                                key={item.id}
                                                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                                                onPress={() => setCategory(item.id)}
                                            >
                                                <Icon size={16} color={isSelected ? theme.colors.background : theme.colors.text} />
                                                <Text style={[styles.categoryLabel, isSelected && styles.categoryLabelActive]}>
                                                    {item.label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>What can we improve?</Text>
                                <View style={styles.areasGrid}>
                                    {AREAS.map((item) => {
                                        const isSelected = selectedAreas.includes(item.id);
                                        return (
                                            <TouchableOpacity
                                                key={item.id}
                                                style={[styles.areaItem, isSelected && styles.areaItemActive]}
                                                onPress={() => toggleArea(item.id)}
                                            >
                                                <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                                                    {isSelected && <CheckCircle2 size={14} color={theme.colors.background} />}
                                                </View>
                                                <Text style={[styles.areaLabel, isSelected && styles.areaLabelActive]}>
                                                    {item.label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            <View style={styles.inputSection}>
                                <View style={styles.inputHeader}>
                                    <Text style={styles.sectionTitle}>Tell us more</Text>
                                    <Text style={[styles.charCount, feedback.length > MAX_CHARS * 0.9 && { color: '#FF4444' }]}>
                                        {feedback.length}/{MAX_CHARS}
                                    </Text>
                                </View>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Share your thoughts or suggestions..."
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    multiline
                                    maxLength={MAX_CHARS}
                                    value={feedback}
                                    onChangeText={setFeedback}
                                />
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.submitButton,
                                    (isSubmitting || rating === 0) && styles.submitButtonDisabled
                                ]}
                                onPress={handleSubmit}
                                disabled={isSubmitting || rating === 0}
                            >
                                <Text style={styles.submitButtonText}>
                                    {isSubmitting ? 'Sending...' : 'Send Feedback'}
                                </Text>
                                {!isSubmitting && <Send size={20} color={theme.colors.background} style={{ marginLeft: 8 }} />}
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
        paddingBottom: 40,
    },
    infoBox: {
        alignItems: 'center',
        marginBottom: 20,
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
    ratingContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 30,
    },
    starButton: {
        padding: 4,
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
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        gap: 6,
    },
    categoryChipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    categoryLabel: {
        color: theme.colors.text,
        fontSize: 13,
    },
    categoryLabelActive: {
        color: theme.colors.background,
        fontWeight: 'bold',
    },
    areasGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    areaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
        width: '48%',
        gap: 8,
    },
    areaItemActive: {
        borderColor: 'rgba(19, 236, 91, 0.3)',
        backgroundColor: 'rgba(19, 236, 91, 0.05)',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    areaLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
    },
    areaLabelActive: {
        color: theme.colors.text,
        fontWeight: '500',
    },
    inputSection: {
        marginBottom: 30,
    },
    inputHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    charCount: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.3)',
    },
    textInput: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        padding: 16,
        color: theme.colors.text,
        fontSize: 15,
        minHeight: 120,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    submitButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 16,
        height: 56,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: theme.colors.background,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default FeedbackScreen;
