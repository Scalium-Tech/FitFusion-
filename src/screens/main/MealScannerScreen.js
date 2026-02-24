import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    ActivityIndicator,
    Alert,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import {
    Camera,
    Image as ImageIcon,
    ChevronLeft,
    Zap,
    Scale,
    Flame,
    Beef,
    Wheat,
    CheckCircle2,
    RefreshCcw
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { aiService } from '../../services/aiService';
import { storageService } from '../../services/storageService';

const { width } = Dimensions.get('window');

const MealScannerScreen = ({ navigation }) => {
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState(null);
    const [imageKey, setImageKey] = useState(0);
    const [imageError, setImageError] = useState(false);

    // Handle results from camera if process was killed (Android)
    useEffect(() => {
        const checkPendingResult = async () => {
            try {
                const result = await ImagePicker.getPendingResultAsync();
                if (result && result.length > 0 && !result[0].canceled) {
                    const selectedImage = result[0].assets[0];
                    setImage(selectedImage.uri);
                    setImageKey(prev => prev + 1);
                    analyzeImage(selectedImage.base64);
                }
            } catch (error) {
                console.error('Pending Result Error:', error);
            }
        };

        checkPendingResult();
    }, []);

    const pickImage = async (useCamera = false) => {
        try {
            setImageError(false);
            const permissionResult = useCamera
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (permissionResult.granted === false) {
                Alert.alert('Permission Required', `You need to allow ${useCamera ? 'camera' : 'gallery'} access to scan your meal.`);
                return;
            }

            const pickerResult = useCamera
                ? await ImagePicker.launchCameraAsync({
                    allowsEditing: false,
                    quality: 0.5,
                    base64: true,
                })
                : await ImagePicker.launchImageLibraryAsync({
                    allowsEditing: false,
                    quality: 0.5,
                    base64: true,
                });

            if (!pickerResult.canceled) {
                const selectedImage = pickerResult.assets[0];
                setImage(selectedImage.uri);
                setImageKey(prev => prev + 1);
                analyzeImage(selectedImage.base64);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to select image');
        }
    };

    const analyzeImage = async (base64) => {
        setLoading(true);
        setResult(null);
        try {
            const analysis = await aiService.analyzeMealImage(base64);
            setResult(analysis);
        } catch (error) {
            console.error('Analysis Error:', error);
            Alert.alert('Analysis Failed', 'Could not identify the meal. Please try a clearer photo.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!result || saving) return;

        setSaving(true);
        try {
            await storageService.saveMealLog({
                ...result,
                image_url: image
            });

            Alert.alert(
                'Success!',
                'Meal has been added to your daily diary.',
                [{ text: 'Great!', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.error('Save Error:', error);
            Alert.alert('Error', 'Failed to save meal log. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const renderMacro = (icon, label, value, color) => (
        <View style={styles.macroStat}>
            <View style={[styles.macroIconContainer, { backgroundColor: `${color}15` }]}>
                {React.createElement(icon, { size: 16, color: color })}
            </View>
            <Text style={styles.macroLabel}>{label}</Text>
            <Text style={styles.macroValue}>{value}g</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ChevronLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>AI Meal Scanner</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {!image ? (
                    <View style={styles.placeholderContainer}>
                        <View style={styles.scannerCircle}>
                            <Camera size={48} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.placeholderTitle}>What are you eating?</Text>
                        <Text style={styles.placeholderSubtitle}>Take a photo of your meal for instant nutritional analysis.</Text>

                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={[styles.primaryButton, { marginBottom: 12 }]}
                                onPress={() => pickImage(true)}
                            >
                                <Camera size={20} color="#000" style={{ marginRight: 8 }} />
                                <Text style={styles.primaryButtonText}>Capture Meal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => pickImage(false)}
                            >
                                <ImageIcon size={20} color={theme.colors.text} style={{ marginRight: 8 }} />
                                <Text style={styles.secondaryButtonText}>Pick from Gallery</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.resultsContainer}>
                        <View style={styles.imagePreviewContainer}>
                            {imageError ? (
                                <View style={styles.imageErrorContainer}>
                                    <ImageIcon size={48} color={theme.colors.textMuted} />
                                    <Text style={styles.imageErrorText}>Image failed to load</Text>
                                    <Text style={styles.imageErrorSubtext}>{image}</Text>
                                </View>
                            ) : (
                                <Image
                                    key={imageKey}
                                    source={{ uri: image }}
                                    style={styles.imagePreview}
                                    resizeMode="cover"
                                    onError={(e) => {
                                        console.error('Image load error:', e.nativeEvent.error);
                                        setImageError(true);
                                    }}
                                />
                            )}
                            {loading && (
                                <View style={styles.loadingOverlay}>
                                    <ActivityIndicator size="large" color={theme.colors.primary} />
                                    <Text style={styles.loadingText}>Analyzing with Gemini AI...</Text>
                                </View>
                            )}
                        </View>

                        {result && (
                            <View style={styles.analysisCard}>
                                <View style={styles.resultHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.mealName}>{result.name}</Text>
                                        <View style={styles.confidenceRow}>
                                            <CheckCircle2 size={12} color={theme.colors.primary} />
                                            <Text style={styles.confidenceText}>
                                                {Math.round(result.confidence * 100)}% AI Confidence
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.caloriesBadge}>
                                        <Flame size={16} color="#FF6B6B" />
                                        <Text style={styles.caloriesValue}>{result.calories} kcal</Text>
                                    </View>
                                </View>

                                <View style={styles.macrosRow}>
                                    {renderMacro(Beef, 'Protein', result.protein, '#FFD700')}
                                    {renderMacro(Wheat, 'Carbs', result.carbs, '#13EC5B')}
                                    {renderMacro(Flame, 'Fats', result.fats, '#FF4500')}
                                </View>

                                <View style={styles.descriptionBox}>
                                    <Zap size={16} color={theme.colors.primary} style={styles.descriptionIcon} />
                                    <Text style={styles.descriptionText}>{result.description}</Text>
                                </View>

                                <TouchableOpacity
                                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                                    onPress={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <ActivityIndicator color="#000" />
                                    ) : (
                                        <Text style={styles.saveButtonText}>Save to Daily Log</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.retakeButton}
                                    onPress={() => setImage(null)}
                                >
                                    <RefreshCcw size={16} color={theme.colors.textMuted} style={{ marginRight: 6 }} />
                                    <Text style={styles.retakeButtonText}>Scan Another</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
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
        paddingVertical: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    placeholderContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
        marginTop: 60,
    },
    scannerCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        borderStyle: 'dashed',
    },
    placeholderTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 12,
        textAlign: 'center',
    },
    placeholderSubtitle: {
        fontSize: 15,
        color: theme.colors.textMuted,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 40,
    },
    actionButtons: {
        width: '100%',
    },
    primaryButton: {
        backgroundColor: theme.colors.primary,
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
    secondaryButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginTop: 12,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
    },
    resultsContainer: {
        paddingHorizontal: 20,
    },
    imagePreviewContainer: {
        width: '100%',
        height: width * 0.75,
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    imageErrorContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    imageErrorText: {
        color: theme.colors.textMuted,
        marginTop: 10,
        fontSize: 14,
        fontWeight: '600',
    },
    imageErrorSubtext: {
        color: theme.colors.textMuted,
        fontSize: 10,
        marginTop: 5,
        opacity: 0.5,
        textAlign: 'center',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: theme.colors.primary,
        marginTop: 15,
        fontWeight: '600',
        fontSize: 16,
    },
    analysisCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    mealName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 6,
    },
    confidenceRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    confidenceText: {
        fontSize: 12,
        color: theme.colors.primary,
        marginLeft: 6,
        fontWeight: '600',
    },
    caloriesBadge: {
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    caloriesValue: {
        color: '#FF6B6B',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 6,
    },
    macrosRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    macroStat: {
        flex: 1,
        alignItems: 'center',
    },
    macroIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    macroLabel: {
        fontSize: 11,
        color: theme.colors.textMuted,
        marginBottom: 4,
    },
    macroValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    descriptionBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(19, 236, 91, 0.05)',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        alignItems: 'flex-start',
    },
    descriptionIcon: {
        marginTop: 2,
        marginRight: 8,
    },
    descriptionText: {
        color: theme.colors.text,
        fontSize: 14,
        flex: 1,
        lineHeight: 20,
    },
    saveButton: {
        backgroundColor: theme.colors.primary,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
    retakeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    retakeButtonText: {
        color: theme.colors.textMuted,
        fontSize: 14,
        fontWeight: '600',
    }
});

export default MealScannerScreen;
