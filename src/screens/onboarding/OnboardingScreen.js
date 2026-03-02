import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import Svg, { Circle as SvgCircle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { theme } from '../../theme';
import { aiService } from '../../services/aiService';
import { storageService } from '../../services/storageService';
import {
    ArrowRight,
    ChevronLeft,
    User,
    Dumbbell,
    Heart,
    Zap,
    CheckCircle,
    Mars,
    Venus,
    Transgender,
    Plus,
    Minus,
    TrendingUp,
    Target,
    Activity,
    Accessibility,
    ShieldCheck,
    Circle,
    X,
    Flame,
    Bolt,
    Leaf,
    Utensils,
    Egg,
    Switch,
    Home,
    Layout,
    Clock,
    Lightbulb,
    Info,
    Search
} from 'lucide-react-native';

const AIGenerationStep = ({ theme, onComplete }) => {
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    const [progress, setProgress] = useState(0);

    React.useEffect(() => {
        let interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 1;
            });
        }, 30);
        return () => clearInterval(interval);
    }, []);

    const hasCompleted = React.useRef(false);

    React.useEffect(() => {
        if (progress === 100 && onComplete && !hasCompleted.current) {
            hasCompleted.current = true;
            console.log('[Onboarding] AIGenerationStep progress 100%, triggering onComplete');
            setTimeout(() => onComplete(), 500);
        }
    }, [progress, onComplete]);

    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <View style={styles.stepContainer}>
            <View style={styles.aiHeader}>
                <Text style={styles.aiUpperTitle}>FITFUSION AI</Text>
            </View>

            {/* Circular Progress */}
            <View style={styles.circularContainer}>
                <View style={styles.glowEffect} />
                <Svg width="220" height="220" viewBox="0 0 200 200">
                    <SvgCircle
                        cx="100"
                        cy="100"
                        r={radius}
                        stroke="rgba(19, 236, 91, 0.1)"
                        strokeWidth="10"
                        fill="transparent"
                    />
                    <SvgCircle
                        cx="100"
                        cy="100"
                        r={radius}
                        stroke={theme.colors.primary}
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                    />
                </Svg>
                <View style={styles.progressCenter}>
                    <View style={styles.innerCircle}>
                        <Image
                            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCStIRCFJh2m4JXxjsUgA0SeqUFT5fey007_0HGMaAMWUwQaXFf1dFiVERZOMU3Wm35FAOM8z8Ird6KGr52FXoRToFksXlfzneN9-PIC4JtTHPFwedSWjgOaNlUWeoyWpYV0cNr8GZtZLyag7PSBY5_E_LnkwJCTstnGmbIhwkLTJ714pE0jU0x4K0xi_zIRYQwCGfEwOkahHLvs6yj2qo2EDF9YmXcpC4yJmGHIO41Gr8kh88seHjCmMPVq_mNBcp1SIJpjQDzVt1R' }}
                            style={styles.centerImage}
                        />
                        <View style={styles.imageOverlay}>
                            <Text style={styles.percentageText}>{progress}%</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Status Header */}
            <View style={styles.statusHeader}>
                <Text style={styles.statusTitle}>
                    Creating your{"\n"}
                    <Text style={{ color: theme.colors.primary }}>AI fitness plan</Text>...
                </Text>
                <Text style={styles.statusSubtitle}>Your personalized plan is almost ready.</Text>
            </View>

            {/* Progress Steps */}
            <View style={styles.aiStepsCard}>
                <View style={styles.aiStepItem}>
                    <View style={styles.aiCheckIcon}>
                        <CheckCircle size={14} color={theme.colors.background} />
                    </View>
                    <Text style={styles.aiStepText}>Analyzing body metrics...</Text>
                </View>

                <View style={styles.aiStepItem}>
                    <View style={styles.aiRunningIcon}>
                        <View style={styles.aiRunningDot} />
                    </View>
                    <Text style={styles.aiStepTextActive}>Optimizing workout splits...</Text>
                    <Text style={styles.runningBadge}>Running</Text>
                </View>

                <View style={[styles.aiStepItem, { opacity: 0.4 }]}>
                    <View style={styles.aiPendingIcon} />
                    <Text style={styles.aiStepText}>Finalizing nutrition goals...</Text>
                </View>
            </View>

            {/* AI Insight Card */}
            <View style={styles.insightFooter}>
                <View style={styles.insightBadge}>
                    <Lightbulb size={14} color={theme.colors.primary} />
                    <Text style={styles.insightBadgeText}>AI INSIGHT</Text>
                </View>
                <Text style={styles.insightQuote}>
                    "Consistency is the key to unlocking 80% of your results. We're building a schedule that fits your life, not just your goals."
                </Text>
            </View>
        </View>
    );
};

const OnboardingScreen = ({ navigation, route, setIsOnboarded }) => {
    const [step, setStep] = useState(1);
    const totalSteps = 10;
    const [userData, setUserData] = useState({
        name: '',
        goal: '',
        age: 24,
        gender: 'male',
        height: 182,
        heightUnit: 'cm',
        weight: 75.5,
        weightUnit: 'kg',
        targetWeight: 70.0,
        targetWeightUnit: 'kg',
        focusAreas: [],
        activityLevel: 'moderate',
        experience: 'intermediate',
        sleepHours: 7,
        healthConditions: ['none'],
        trainingDays: 3,
        dietType: 'vegetarian',
        dietBudget: 150,
        allergies: ['gluten'],
        highProteinFocus: true,
        workoutLocation: '',
        equipment: [],
        preferredDuration: 0,
        region: '',
    });
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    React.useEffect(() => {
        console.log(`[Onboarding] Component mounted/updated. Current step: ${step}`);
    }, [step]);

    React.useEffect(() => {
        if (route.params?.name) {
            setUserData(prev => ({ ...prev, name: route.params.name }));
        }
    }, [route.params?.name]);

    const nextStep = () => {
        if (isProcessing) return;
        setIsProcessing(true);
        console.log(`[Onboarding] nextStep called for step ${step}`);

        // Helper to reset processing and increment step
        const proceed = (customStep = null) => {
            setIsProcessing(false);
            if (customStep !== null) setStep(customStep);
            else setStep(prev => prev + 1);
        };
        if (step === 1 && !userData.name) {
            alert('Please enter your name');
            setIsProcessing(false);
            return;
        }
        if (step === 2 && !userData.goal) {
            alert('Please select a goal');
            setIsProcessing(false);
            return;
        }
        if (step === 3 && (!userData.age || !userData.gender || !userData.height || !userData.weight)) {
            alert('Please fill in all body details');
            setIsProcessing(false);
            return;
        }
        if (step === 4 && !userData.targetWeight) {
            alert('Please specify a target weight or skip');
            setIsProcessing(false);
            return;
        }
        if (step === 5 && userData.focusAreas.length === 0) {
            alert('Please select at least one focus area');
            setIsProcessing(false);
            return;
        }
        if (step === 6 && userData.healthConditions.length === 0) {
            alert('Please select a health condition or select "None"');
            setIsProcessing(false);
            return;
        }
        if (step === 7 && !userData.experience) {
            alert('Please select your activity level');
            setIsProcessing(false);
            return;
        }
        if (step === 8 && !userData.dietType) {
            alert('Please select your diet type');
            setIsProcessing(false);
            return;
        }
        if (step === 9 && !userData.workoutLocation) {
            alert('Please select your workout location');
            setIsProcessing(false);
            return;
        }
        if (step === 10) {
            console.log('[Onboarding] Starting AI Plan Generation...');
            setIsAnalyzing(true);
            const triggerPlanGeneration = async () => {
                try {
                    // Generate the AI plan
                    const planResult = await aiService.generateFitnessPlan(userData);

                    // Save the plan and user data
                    await storageService.savePlan(planResult);
                    await storageService.saveUserData(userData);
                    await storageService.setIsOnboarded(true);

                    console.log('[Onboarding] Plan generated and saved successfully');
                    setIsAnalyzing(false);
                    setIsProcessing(false);
                    if (setIsOnboarded) {
                        setIsOnboarded(true);
                    } else {
                        alert('Onboarding Complete! Welcome to FitFusion AI.');
                    }
                } catch (error) {
                    console.error('[Onboarding] AI Generation Failed:', error);
                    setIsAnalyzing(false);
                    setIsProcessing(false);

                    const errorMsg = error.message?.includes('timed out')
                        ? "AI generation took longer than expected. Please check your internet connection and try again."
                        : (error.message || "Something went wrong while generating your plan. Please try again.");

                    alert(errorMsg);
                }
            };

            triggerPlanGeneration();
            return;
        }

        proceed();
    };

    const prevStep = () => {
        if (step > 1) {
            setStep(step - 1);
        } else {
            navigation.goBack();
        }
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.headerTop}>
                <TouchableOpacity onPress={prevStep} style={styles.backButton}>
                    <ChevronLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerStepText}>Step {step} of {totalSteps}</Text>
                <Text style={styles.headerPercentText}>{Math.round((step / totalSteps) * 100)}%</Text>
            </View>
            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${(step / totalSteps) * 100}%` }]} />
            </View>
        </View>
    );

    const renderNameStep = () => (
        <View style={styles.stepContainer}>
            <View style={styles.brandingContainer}>
                <Text style={styles.brandingText}>FF.AI</Text>
            </View>

            <View style={styles.headerSection}>
                <Text style={styles.title}>
                    {`What should we\n`}
                    <Text style={{ color: theme.colors.primary, fontSize: 48 }}>call you?</Text>
                </Text>
                <Text style={styles.subtitle}>
                    Your name helps us tailor your fitness experience.
                </Text>
            </View>

            <View style={styles.formSection}>
                <Text style={styles.inputLabel}>Your Name</Text>
                <View style={styles.inputWrapper}>
                    <View style={styles.inputIcon}>
                        <User size={20} color={theme.colors.primary} />
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your name..."
                        placeholderTextColor={theme.colors.textMuted}
                        value={userData.name}
                        onChangeText={(text) => setUserData({ ...userData, name: text })}
                        autoFocus
                    />
                </View>

                {/* Dynamic Greeting Card */}
                <View style={styles.greetingCard}>
                    <View style={styles.greetingHeader}>
                        <Text style={styles.greetingBadge}>Preview</Text>
                        <View style={styles.greetingIconBg}>
                            <Dumbbell size={60} color={theme.colors.text} style={{ opacity: 0.1 }} />
                        </View>
                    </View>
                    <Text style={styles.greetingTitle}>
                        {`Welcome, ${userData.name || 'Yash'} 💪`}
                    </Text>
                    <Text style={styles.greetingSubtitle}>
                        Let's personalize your fitness journey with AI-driven insights.
                    </Text>
                    <View style={styles.blob} />
                </View>
            </View>

            {/* Personality Image Section */}
            <View style={styles.personalityContainer}>
                <Image
                    source={require('../../../assets/onboarding/personality.png')}
                    style={styles.personalityImage}
                    resizeMode="cover"
                />
                <View style={styles.personalityOverlay} />
                <View style={styles.personalityBadge}>
                    <Text style={styles.personalityText}>FITFUSION AI PERSONALITY</Text>
                </View>
            </View>
        </View>
    );

    const renderGoalStep = () => {
        const goals = [
            {
                id: 'lose_weight',
                title: 'Lose Weight',
                description: 'Burn fat and get leaner with high-intensity cardio.',
                icon: <Dumbbell size={28} color={theme.colors.primary} />,
                bg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_EdMc2ci46XllxR0JDvZ-YscJGVgaTAh8EopilQFqT_bepSTLQn3IJvJsIcXfqQoKrSVeJSppWjJgVdUT2yuo1eelDgFu67ZVewV9QTjrH-KBR5BlkQtJSz7krKMYRhs4Ukwtsl8YBxTTBzXBXdpPBd7_utTGfumIItNPXfXsuuW3S3Ay0VUVKDIJHvBEkDzsAxhTZnMIL3oo5Q_I6l2ByC1w8ajDI4dNEAbA6NNgk96UnxEgG0H6c-2VhN6moBOnjPzPnMi_HnpK'
            },
            {
                id: 'build_muscle',
                title: 'Gain Muscle',
                description: 'Build strength and mass with targeted lifting.',
                icon: <Dumbbell size={28} color={theme.colors.background} />,
                popular: true,
                bg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcWrkWZcUUeHyPTmt0uy2Qd2CDPyXFHo7AEWlgI37HlzCCWl94YRHg1hv_RCxbESd4F3mksLvoVmQ1_3GDMtDxLxQ7yqRATo4F02XQvuwEtAhR5ytow3JGdgQLw9J1SQolZLJ5ZMMORJR-PiBXf44Fw1CnqaTPYc_FYAXd38ZO4rFR6oe5TpZSESzFnwSBxwg8XaxBUkj6MsCLScJ-c8z9XmmjmXEVOGqv7XkZn-ZMZT85BH4fmYvDqPlDTO4tM_N_4wkee-hBX8ig'
            },
            {
                id: 'stay_fit',
                title: 'Stay Fit',
                description: 'Maintain your health and daily energy levels.',
                icon: <Heart size={28} color={theme.colors.primary} />,
                bg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBy10s6IyNnVPXZLc_2zCnQi7OBPQSqTThwMN2zMA84PFMU4K2oSIrWaqsXQe8EZgGIQzE88OiCggUnX0rFTdzOmGOZG8-ZgCqlXdtI4BSKwGqPhkzzOGB3K5x5N0JG0COO2IsEe5H5PSn2B_guZ_Lu-dNmIbjWjLGCrl-eHvsDt1hSxJGPpNjo9jA9l9NUse_cQ-vW5HOsQa8hVhXTuXWQN29YB3vr8pcSHk67rwJEisp_wYjyRyQTpFyk-Olm7WPjqVcib3HPwydS'
            },
            {
                id: 'improve_stamina',
                title: 'Improve Stamina',
                description: 'Increase endurance for sports and long runs.',
                icon: <Zap size={28} color={theme.colors.primary} />,
                bg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcit9Mi1rnDjB95ad7ZENwiIfcVYP9AYjK8-GLKv9jzXQOA3KnvkyZNFj5_YdMZsXGGqBoudYm_RRXzCdlJ_LY4SiaXFdaS62GDafjySFEW7j4kzOOoBCfLKEJTfr2qPTbDCrvgGSiStPHdXJJ0UyddoZ7Kty-YvnWVRT8IN_e34e8fAhWXaesewDaFwqpfdzpDO1TYr8bGVSru2Ax07IAoSuxQffM2LHFdrNQbq1k2JknqRyfg0w9UN0q7H1aO4YFWR6w5YXpF7MJ'
            },
        ];

        return (
            <View style={styles.stepContainer}>
                <View style={styles.headerSection}>
                    <Text style={styles.title}>
                        What is your <Text style={{ color: theme.colors.primary }}>goal?</Text>
                    </Text>
                    <Text style={styles.subtitle}>Select the primary focus for your FitFusion AI training plan.</Text>
                </View>

                <View style={styles.goalsGrid}>
                    {goals.map((g) => {
                        const isSelected = userData.goal === g.id;
                        return (
                            <TouchableOpacity
                                key={g.id}
                                style={[
                                    styles.goalCard,
                                    isSelected && styles.selectedGoalCard
                                ]}
                                onPress={() => setUserData({ ...userData, goal: g.id })}
                                activeOpacity={0.7}
                            >
                                <View style={styles.goalCardContent}>
                                    <View style={[
                                        styles.goalIconWrapper,
                                        isSelected && styles.selectedGoalIconWrapper
                                    ]}>
                                        {React.cloneElement(g.icon, {
                                            color: isSelected ? theme.colors.background : theme.colors.primary
                                        })}
                                    </View>
                                    <View style={styles.goalTextWrapper}>
                                        <View style={styles.goalTitleRow}>
                                            <Text style={styles.goalTitle}>{g.title}</Text>
                                            {g.popular && (
                                                <View style={styles.popularBadge}>
                                                    <Text style={styles.popularBadgeText}>Popular</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={[
                                            styles.goalDescription,
                                            isSelected && { color: 'rgba(255, 255, 255, 0.7)' }
                                        ]}>{g.description}</Text>
                                    </View>
                                    {isSelected && (
                                        <View style={styles.checkWrapper}>
                                            <CheckCircle size={24} color={theme.colors.primary} fill={theme.colors.primary} />
                                        </View>
                                    )}
                                </View>

                                <View style={styles.goalCardBgWrapper}>
                                    <Image
                                        source={{ uri: g.bg }}
                                        style={styles.goalCardBg}
                                        resizeMode="cover"
                                    />
                                    <View style={[
                                        styles.goalCardBgOverlay,
                                        isSelected && { opacity: 0.2 }
                                    ]} />
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        );
    };

    const renderBodyDetailsStep = () => (
        <View style={styles.stepContainer}>
            <View style={styles.headerSection}>
                <Text style={styles.title}>Tell us about yourself</Text>
                <Text style={styles.subtitle}>This helps our AI personalize your fitness plan.</Text>
            </View>

            {/* Gender Selector */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Gender</Text>
                <View style={styles.genderGrid}>
                    {[
                        { id: 'male', label: 'Male', icon: Mars },
                        { id: 'female', label: 'Female', icon: Venus },
                        { id: 'other', label: 'Other', icon: Transgender },
                    ].map((g) => {
                        const isSelected = userData.gender === g.id;
                        return (
                            <TouchableOpacity
                                key={g.id}
                                style={[
                                    styles.genderCard,
                                    isSelected && styles.selectedGenderCard
                                ]}
                                onPress={() => setUserData({ ...userData, gender: g.id })}
                            >
                                <g.icon
                                    size={32}
                                    color={isSelected ? theme.colors.primary : theme.colors.textMuted}
                                />
                                <Text style={[
                                    styles.genderLabel,
                                    isSelected && styles.selectedGenderLabel
                                ]}>{g.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Age Selector */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Age</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TextInput
                            style={[styles.valueText, { textAlign: 'right', minWidth: 40 }]}
                            keyboardType="number-pad"
                            value={userData.age.toString()}
                            onChangeText={(text) => {
                                const sanitized = text.replace(/[^0-9]/g, '');
                                setUserData({ ...userData, age: sanitized === '' ? '' : Number(sanitized) });
                            }}
                        />
                        <Text style={[styles.unitText, { marginLeft: 4 }]}>Years</Text>
                    </View>
                </View>
                <View style={styles.sliderCard}>
                    <Slider
                        style={styles.slider}
                        minimumValue={12}
                        maximumValue={100}
                        step={1}
                        value={Number(userData.age)}
                        onValueChange={(val) => setUserData({ ...userData, age: Number(val) })}
                        minimumTrackTintColor={theme.colors.primary}
                        maximumTrackTintColor="rgba(255, 255, 255, 0.1)"
                        thumbTintColor={theme.colors.primary}
                    />
                    <View style={styles.sliderLabels}>
                        <Text style={styles.sliderLabel}>12</Text>
                        <Text style={styles.sliderLabel}>100</Text>
                    </View>
                </View>
            </View>

            {/* Height Selector */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Height</Text>
                    <View style={styles.valueHeaderRight}>
                        <TextInput
                            style={[styles.valueText, { textAlign: 'right', minWidth: 60 }]}
                            keyboardType="decimal-pad"
                            value={userData.height.toString()}
                            onChangeText={(text) => {
                                const sanitized = text.replace(/[^0-9.]/g, '');
                                if (sanitized === '' || sanitized === '.') {
                                    setUserData({ ...userData, height: sanitized });
                                } else {
                                    setUserData({ ...userData, height: Number(sanitized) });
                                }
                            }}
                        />
                        <Text style={styles.unitText}>{userData.heightUnit}</Text>
                        <View style={styles.unitToggle}>
                            <TouchableOpacity
                                style={[styles.unitButton, userData.heightUnit === 'cm' && styles.unitButtonActive]}
                                onPress={() => setUserData({ ...userData, heightUnit: 'cm' })}
                            >
                                <Text style={[styles.unitButtonText, userData.heightUnit === 'cm' && styles.unitButtonTextActive]}>CM</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.unitButton, userData.heightUnit === 'ft' && styles.unitButtonActive]}
                                onPress={() => setUserData({ ...userData, heightUnit: 'ft' })}
                            >
                                <Text style={[styles.unitButtonText, userData.heightUnit === 'ft' && styles.unitButtonTextActive]}>FT</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
                <View style={styles.sliderCard}>
                    <Slider
                        style={styles.slider}
                        minimumValue={userData.heightUnit === 'cm' ? 100 : 3}
                        maximumValue={userData.heightUnit === 'cm' ? 250 : 8}
                        step={userData.heightUnit === 'cm' ? 1 : 0.1}
                        value={Number(userData.height)}
                        onValueChange={(val) => setUserData({ ...userData, height: val })}
                        minimumTrackTintColor={theme.colors.primary}
                        maximumTrackTintColor="rgba(255, 255, 255, 0.1)"
                        thumbTintColor={theme.colors.primary}
                    />
                    <View style={styles.sliderLabels}>
                        <Text style={styles.sliderLabel}>{userData.heightUnit === 'cm' ? '100 cm' : '3 ft'}</Text>
                        <Text style={styles.sliderLabel}>{userData.heightUnit === 'cm' ? '250 cm' : '8 ft'}</Text>
                    </View>
                </View>
            </View>

            {/* Weight Selector */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Weight</Text>
                    <View style={styles.valueHeaderRight}>
                        <TextInput
                            style={{
                                fontSize: 24,
                                fontWeight: 'bold',
                                color: theme.colors.primary,
                                padding: 0,
                                minWidth: 60,
                                textAlign: 'right'
                            }}
                            keyboardType="decimal-pad"
                            value={userData.weight.toString()}
                            onChangeText={(text) => {
                                const sanitized = text.replace(/[^0-9.]/g, '');
                                if (sanitized === '' || sanitized === '.') {
                                    setUserData({ ...userData, weight: sanitized });
                                } else {
                                    setUserData({ ...userData, weight: Number(sanitized) });
                                }
                            }}
                        />
                        <Text style={styles.unitText}>{userData.weightUnit}</Text>
                        <View style={styles.unitToggle}>
                            <TouchableOpacity
                                style={[styles.unitButton, userData.weightUnit === 'kg' && styles.unitButtonActive]}
                                onPress={() => setUserData({ ...userData, weightUnit: 'kg' })}
                            >
                                <Text style={[styles.unitButtonText, userData.weightUnit === 'kg' && styles.unitButtonTextActive]}>KG</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.unitButton, userData.weightUnit === 'lb' && styles.unitButtonActive]}
                                onPress={() => setUserData({ ...userData, weightUnit: 'lb' })}
                            >
                                <Text style={[styles.unitButtonText, userData.weightUnit === 'lb' && styles.unitButtonTextActive]}>LB</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
                <View style={styles.sliderCard}>
                    <View style={styles.precisionContainer}>
                        <TouchableOpacity
                            style={styles.precisionButton}
                            onPress={() => setUserData({ ...userData, weight: Number(userData.weight) - 0.1 })}
                        >
                            <Minus size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                        <View style={styles.precisionIndicator}>
                            <View style={styles.precisionLine} />
                            <Text style={styles.precisionText}>PRECISION ADJUST</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.precisionButton}
                            onPress={() => setUserData({ ...userData, weight: Number(userData.weight) + 0.1 })}
                        >
                            <Plus size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </View>
                    <Slider
                        style={styles.slider}
                        minimumValue={userData.weightUnit === 'kg' ? 30 : 66}
                        maximumValue={userData.weightUnit === 'kg' ? 200 : 440}
                        step={0.1}
                        value={isNaN(Number(userData.weight)) ? 0 : Number(userData.weight)}
                        onValueChange={(val) => setUserData({ ...userData, weight: val })}
                        minimumTrackTintColor={theme.colors.primary}
                        maximumTrackTintColor="rgba(255, 255, 255, 0.1)"
                        thumbTintColor={theme.colors.primary}
                    />
                </View>
            </View>

            {/* Decorative background blurs */}
            <View style={styles.blur1} />
            <View style={styles.blur2} />
        </View>
    );

    const renderTargetWeightStep = () => (
        <View style={styles.stepContainer}>
            <View style={styles.headerSection}>
                <Text style={styles.title}>
                    Do you have a <Text style={{ color: theme.colors.primary }}>target weight</Text>?
                </Text>
                <Text style={styles.subtitle}>
                    This helps our AI calculate your daily caloric needs and estimated timeline to reach your peak physique.
                </Text>
            </View>

            <View style={{ alignItems: 'center', gap: 32, marginTop: 24 }}>
                <View style={styles.unitToggle}>
                    <TouchableOpacity
                        style={[styles.unitButton, userData.targetWeightUnit === 'kg' && styles.unitButtonActive]}
                        onPress={() => setUserData({ ...userData, targetWeightUnit: 'kg' })}
                    >
                        <Text style={[styles.unitButtonText, userData.targetWeightUnit === 'kg' && styles.unitButtonTextActive]}>KG</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.unitButton, userData.targetWeightUnit === 'lb' && styles.unitButtonActive]}
                        onPress={() => setUserData({ ...userData, targetWeightUnit: 'lb' })}
                    >
                        <Text style={[styles.unitButtonText, userData.targetWeightUnit === 'lb' && styles.unitButtonTextActive]}>LB</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ alignItems: 'baseline', flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(19, 236, 91, 0.3)' }}>
                    <TextInput
                        style={{
                            fontSize: 72,
                            fontWeight: 'bold',
                            color: theme.colors.text,
                            minWidth: 120,
                            textAlign: 'right',
                            fontFamily: Platform.OS === 'ios' ? 'Space Grotesk' : undefined
                        }}
                        keyboardType="decimal-pad"
                        value={userData.targetWeight.toString()}
                        onChangeText={(text) => {
                            // Only allow numbers and one decimal point
                            const sanitized = text.replace(/[^0-9.]/g, '');
                            if (sanitized === '' || sanitized === '.') {
                                setUserData({ ...userData, targetWeight: sanitized });
                            } else {
                                setUserData({ ...userData, targetWeight: Number(sanitized) });
                            }
                        }}
                    />
                    <Text style={{ fontSize: 32, fontWeight: 'bold', color: theme.colors.primary, marginLeft: 4 }}>
                        {userData.targetWeightUnit}
                    </Text>
                </View>

                <View style={styles.rulerContainer}>
                    <Slider
                        style={{ width: '100%', height: 60, zIndex: 10 }}
                        minimumValue={userData.targetWeightUnit === 'kg' ? 30 : 66}
                        maximumValue={userData.targetWeightUnit === 'kg' ? 200 : 440}
                        step={0.1}
                        value={isNaN(Number(userData.targetWeight)) ? 0 : Number(userData.targetWeight)}
                        onValueChange={(val) => setUserData({ ...userData, targetWeight: val })}
                        minimumTrackTintColor="transparent"
                        maximumTrackTintColor="transparent"
                        thumbTintColor="transparent"
                    />
                    <View style={styles.rulerVisual}>
                        {[...Array(21)].map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.rulerLine,
                                    i === 10 && { height: 40, backgroundColor: theme.colors.primary, opacity: 1 },
                                    (i === 0 || i === 20) && { opacity: 0.1 },
                                    (i === 5 || i === 15) && { height: 30, opacity: 0.5 }
                                ]}
                            />
                        ))}
                    </View>
                    <View style={styles.rulerPointer}>
                        <ArrowRight size={24} color={theme.colors.primary} style={{ transform: [{ rotate: '90deg' }] }} />
                    </View>
                </View>

                <View style={styles.insightCard}>
                    <View style={styles.insightIconWrapper}>
                        <TrendingUp size={20} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.insightText}>
                        Based on your profile, we recommend a target weight between <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>65-72kg</Text> for optimal health.
                    </Text>
                </View>
            </View>

            <TouchableOpacity
                style={{ marginTop: 40, alignSelf: 'center' }}
                onPress={() => setStep(step + 1)}
            >
                <Text style={{ color: theme.colors.textMuted, fontSize: 14, fontWeight: '600' }}>Skip for now</Text>
            </TouchableOpacity>
        </View>
    );

    const renderFocusAreasStep = () => {
        const areas = [
            { id: 'chest', label: 'Chest', icon: Dumbbell },
            { id: 'back', label: 'Back', icon: Accessibility },
            { id: 'shoulders', label: 'Shoulders', icon: Zap },
            { id: 'arms', label: 'Arms', icon: Activity },
            { id: 'abs', label: 'Abs', icon: Heart },
            { id: 'legs', label: 'Legs', icon: TrendingUp },
        ];

        const toggleArea = (id) => {
            const current = [...userData.focusAreas];
            const index = current.indexOf(id);
            if (index > -1) {
                current.splice(index, 1);
            } else {
                current.push(id);
            }
            setUserData({ ...userData, focusAreas: current });
        };

        return (
            <View style={styles.stepContainer}>
                <View style={styles.headerSection}>
                    <Text style={styles.title}>
                        Which <Text style={{ color: theme.colors.primary }}>body parts</Text> to focus on?
                    </Text>
                    <Text style={styles.subtitle}>
                        Select one or more areas you want to prioritize in your training plan.
                    </Text>
                </View>

                <View style={styles.focusGrid}>
                    {areas.map((area) => {
                        const isSelected = userData.focusAreas.includes(area.id);
                        const Icon = area.icon;
                        return (
                            <TouchableOpacity
                                key={area.id}
                                style={[
                                    styles.focusCard,
                                    isSelected && styles.focusCardActive
                                ]}
                                onPress={() => toggleArea(area.id)}
                                activeOpacity={0.7}
                            >
                                <View style={[
                                    styles.focusIconWrapper,
                                    isSelected && styles.focusIconWrapperActive
                                ]}>
                                    <Icon
                                        size={24}
                                        color={isSelected ? theme.colors.primary : theme.colors.textMuted}
                                    />
                                </View>
                                <Text style={[
                                    styles.focusCardText,
                                    isSelected && styles.focusCardTextActive
                                ]}>
                                    {area.label}
                                </Text>
                                {isSelected && (
                                    <View style={styles.focusCheckCircle}>
                                        <CheckCircle size={16} color={theme.colors.background} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        );
    };

    const renderHealthConditionsStep = () => {
        const conditions = [
            { id: 'none', label: 'None' },
            { id: 'diabetes', label: 'Diabetes' },
            { id: 'prediabetes', label: 'Pre-diabetes' },
            { id: 'thyroid', label: 'Thyroid' },
            { id: 'highbp', label: 'High BP' },
            { id: 'pcos', label: 'PCOS' },
            { id: 'other', label: 'Other' },
        ];

        const toggleCondition = (id) => {
            let current = [...userData.healthConditions];
            if (id === 'none') {
                current = ['none'];
            } else {
                const noneIndex = current.indexOf('none');
                if (noneIndex > -1) current.splice(noneIndex, 1);

                const index = current.indexOf(id);
                if (index > -1) {
                    current.splice(index, 1);
                    if (current.length === 0) current = ['none'];
                } else {
                    current.push(id);
                }
            }
            setUserData({ ...userData, healthConditions: current });
        };

        return (
            <View style={styles.stepContainer}>
                <View style={styles.headerSection}>
                    <Text style={styles.title}>
                        Any <Text style={{ color: theme.colors.primary }}>health conditions</Text>?
                    </Text>
                    <Text style={styles.subtitle}>
                        This helps our AI adjust your nutrition and workout intensity.
                    </Text>
                </View>

                <View style={styles.conditionsList}>
                    {conditions.map((condition) => {
                        const isSelected = userData.healthConditions.includes(condition.id);
                        return (
                            <TouchableOpacity
                                key={condition.id}
                                style={[
                                    styles.conditionItem,
                                    isSelected && styles.conditionItemActive
                                ]}
                                onPress={() => toggleCondition(condition.id)}
                            >
                                <Text style={[
                                    styles.conditionLabel,
                                    isSelected && styles.conditionLabelActive
                                ]}>
                                    {condition.label}
                                </Text>
                                {isSelected ? (
                                    <CheckCircle size={24} color={theme.colors.primary} />
                                ) : (
                                    <View style={styles.radioUnchecked} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={styles.safetyCard}>
                    <View style={styles.safetyIconWrapper}>
                        <ShieldCheck size={24} color={theme.colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.safetyTitle}>Personalized Safety</Text>
                        <Text style={styles.safetyText}>We'll personalize your plan safely based on your inputs.</Text>
                    </View>
                </View>
            </View>
        );
    };


    const renderActivityLevelStep = () => {
        const levels = [
            { id: 'beginner', title: 'Beginner', subtitle: 'Just starting out / low intensity', icon: Bolt },
            { id: 'intermediate', title: 'Intermediate', subtitle: 'Consistent workouts / moderate intensity', icon: Zap },
            { id: 'advanced', title: 'Advanced', subtitle: 'High performance / heavy training', icon: Flame },
        ];

        const getAdvice = (level) => {
            switch (level) {
                case 'beginner': return "Starting with 2-3 days/week is perfect for building a solid foundation without burnout.";
                case 'intermediate': return "3-5 days/week is ideal for maintaining muscle mass while allowing optimal recovery.";
                case 'advanced': return "5-6 days/week allows for high volume splits and maximal performance outcomes.";
                default: return "Select your level to get personalized AI training advice.";
            }
        };

        return (
            <View style={styles.stepContainer}>
                <View style={styles.headerSection}>
                    <Text style={styles.title}>
                        How active <Text style={{ color: theme.colors.primary }}>are you?</Text>
                    </Text>
                    <Text style={styles.subtitle}>
                        Help FitFusion AI calibrate your baseline and training intensity.
                    </Text>
                </View>

                <View style={styles.activityList}>
                    {levels.map((level) => {
                        const isSelected = userData.experience === level.id;
                        const Icon = level.icon;
                        return (
                            <TouchableOpacity
                                key={level.id}
                                style={[
                                    styles.activityCard,
                                    isSelected && styles.activityCardActive
                                ]}
                                onPress={() => {
                                    const defaultDays = level.id === 'beginner' ? 3 : level.id === 'intermediate' ? 5 : 6;
                                    setUserData({ ...userData, experience: level.id, trainingDays: defaultDays });
                                }}
                            >
                                <View style={[
                                    styles.activityIconWrapper,
                                    isSelected && styles.activityIconWrapperActive
                                ]}>
                                    <Icon size={24} color={isSelected ? theme.colors.primary : theme.colors.textMuted} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.activityCardTitle, isSelected && styles.activityCardTitleActive]}>{level.title}</Text>
                                    <Text style={styles.activityCardSubtitle}>{level.subtitle}</Text>
                                </View>
                                <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                                    {isSelected && <View style={styles.radioInner} />}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={styles.frequencySection}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text style={styles.frequencyTitle}>Days per week?</Text>
                        <View style={styles.suggestedBadge}>
                            <Text style={styles.suggestedBadgeText}>AI Suggested</Text>
                        </View>
                    </View>
                    <View style={styles.dayButtonsRow}>
                        {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                            <TouchableOpacity
                                key={num}
                                style={[
                                    styles.dayButton,
                                    userData.trainingDays === num && styles.dayButtonActive
                                ]}
                                onPress={() => setUserData({ ...userData, trainingDays: num })}
                            >
                                <Text style={[
                                    styles.dayButtonText,
                                    userData.trainingDays === num && styles.dayButtonTextActive
                                ]}>
                                    {num}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.adviceCard}>
                    <Zap size={20} color={theme.colors.primary} />
                    <Text style={styles.adviceText}>
                        "{getAdvice(userData.experience)}"
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.laterButton}
                    onPress={() => nextStep()}
                >
                    <Text style={styles.laterButtonText}>I'll decide later</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderDietPreferenceStep = () => {
        const dietTypes = [
            { id: 'vegetarian', title: 'Vegetarian', subtitle: 'Plant-based foods and dairy', icon: Leaf, color: '#16a34a' },
            { id: 'non-vegetarian', title: 'Non-Vegetarian', subtitle: 'Includes meat, poultry, and fish', icon: Utensils, color: '#dc2626' },
            { id: 'eggetarian', title: 'Eggetarian', subtitle: 'Vegetarian diet plus eggs', icon: Egg, color: '#ca8a04' },
        ];

        const budgetOptions = [150, 300, 500];

        const allergiesList = [
            { id: 'peanuts', label: 'Peanuts' },
            { id: 'dairy', label: 'Dairy' },
            { id: 'gluten', label: 'Gluten' },
            { id: 'shellfish', label: 'Shellfish' },
            { id: 'soy', label: 'Soy' },
            { id: 'treenuts', label: 'Tree Nuts' },
        ];

        const toggleAllergy = (id) => {
            const current = [...userData.allergies];
            const index = current.indexOf(id);
            if (index > -1) {
                current.splice(index, 1);
            } else {
                current.push(id);
            }
            setUserData({ ...userData, allergies: current });
        };

        return (
            <View style={styles.stepContainer}>
                <View style={styles.headerSection}>
                    <Text style={styles.title}>
                        Your <Text style={{ color: theme.colors.primary }}>diet style</Text>
                    </Text>
                    <Text style={styles.subtitle}>
                        Help us tailor your meal plan to your wallet and palate.
                    </Text>
                </View>

                {/* Diet Type */}
                <View style={styles.dietSection}>
                    <Text style={styles.dietLabel}>DIET TYPE</Text>
                    <View style={styles.dietList}>
                        {dietTypes.map((type) => {
                            const isSelected = userData.dietType === type.id;
                            const Icon = type.icon;
                            return (
                                <TouchableOpacity
                                    key={type.id}
                                    style={[
                                        styles.dietCard,
                                        isSelected && styles.dietCardActive
                                    ]}
                                    onPress={() => setUserData({ ...userData, dietType: type.id })}
                                >
                                    <View style={[styles.dietIconWrapper, { backgroundColor: `${type.color}20` }]}>
                                        <Icon size={24} color={isSelected ? theme.colors.primary : type.color} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.dietCardTitle, isSelected && styles.dietCardTitleActive]}>{type.title}</Text>
                                        <Text style={styles.dietCardSubtitle}>{type.subtitle}</Text>
                                    </View>
                                    {isSelected && <CheckCircle size={20} color={theme.colors.primary} />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Region */}
                <View style={[styles.budgetSection, { marginBottom: 24 }]}>
                    <Text style={styles.dietLabel}>REGION</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="e.g., India, USA, UK"
                        placeholderTextColor={theme.colors.textMuted}
                        value={userData.region}
                        onChangeText={(text) => setUserData({ ...userData, region: text })}
                    />
                    <Text style={styles.budgetText}>HELPS US RECOMMEND LOCAL FOODS</Text>
                </View>

                {/* Budget */}
                <View style={styles.budgetSection}>
                    <Text style={styles.dietLabel}>DAILY FOOD BUDGET (₹)</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="e.g., 250"
                        placeholderTextColor={theme.colors.textMuted}
                        value={userData.dietBudget ? userData.dietBudget.toString() : ''}
                        onChangeText={(text) => {
                            // Only allow numeric input
                            const numericValue = text.replace(/[^0-9]/g, '');
                            setUserData({ ...userData, dietBudget: numericValue });
                        }}
                        keyboardType="numeric"
                    />
                    <Text style={styles.budgetText}>ESTIMATED MAXIMUM COST PER DAY FOR MEALS</Text>
                </View>

                {/* Allergies */}
                <View style={styles.allergiesSection}>
                    <Text style={styles.dietLabel}>ALLERGIES & SENSITIVITIES</Text>
                    <View style={styles.allergiesGrid}>
                        {allergiesList.map((allergy) => {
                            const isSelected = userData.allergies.includes(allergy.id);
                            return (
                                <TouchableOpacity
                                    key={allergy.id}
                                    style={[
                                        styles.allergyPill,
                                        isSelected && styles.allergyPillActive
                                    ]}
                                    onPress={() => toggleAllergy(allergy.id)}
                                >
                                    <Text style={[
                                        styles.allergyPillText,
                                        isSelected && styles.allergyPillTextActive
                                    ]}>
                                        {allergy.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Protein Focus */}
                <View style={styles.proteinSection}>
                    <View style={styles.proteinCard}>
                        <View style={styles.proteinIconWrapper}>
                            <Dumbbell size={20} color={theme.colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.proteinTitle}>High Protein focus</Text>
                            <Text style={styles.proteinSubtitle}>Prioritize meals with {'>'}30g protein</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setUserData({ ...userData, highProteinFocus: !userData.highProteinFocus })}
                            style={[styles.switchTrack, userData.highProteinFocus && styles.switchTrackActive]}
                        >
                            <View style={[styles.switchThumb, userData.highProteinFocus && styles.switchThumbActive]} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    const renderWorkoutPreferenceStep = () => {
        const locations = [
            { id: 'gym', label: 'Gym', icon: Dumbbell },
            { id: 'home', label: 'Home', icon: Home },
            { id: 'both', label: 'Both', icon: Layout },
        ];

        const equipmentList = [
            { id: 'none', label: 'None (Bodyweight)' },
            { id: 'dumbbells', label: 'Dumbbells' },
            { id: 'barbell', label: 'Barbell' },
            { id: 'kettlebell', label: 'Kettlebell' },
            { id: 'resistance_bands', label: 'Resistance Bands' },
            { id: 'pullup_bar', label: 'Pull-up Bar' },
            { id: 'bench', label: 'Bench' },
        ];

        const durations = [30, 45, 60];

        const toggleEquipment = (id) => {
            const current = [...userData.equipment];
            const index = current.indexOf(id);
            if (index > -1) {
                current.splice(index, 1);
            } else {
                current.push(id);
            }
            setUserData({ ...userData, equipment: current });
        };

        return (
            <View style={styles.stepContainer}>
                <View style={styles.headerSection}>
                    <Text style={styles.title}>
                        Where will you{"\n"}<Text style={{ color: theme.colors.primary }}>work out?</Text>
                    </Text>
                    <Text style={styles.subtitle}>
                        Tailoring your plan based on your environment.
                    </Text>
                </View>

                {/* Location Selection */}
                <View style={styles.locationGrid}>
                    {locations.map((loc) => {
                        const isSelected = userData.workoutLocation === loc.id;
                        const Icon = loc.icon;
                        return (
                            <TouchableOpacity
                                key={loc.id}
                                style={[
                                    styles.locationCard,
                                    isSelected && styles.locationCardActive
                                ]}
                                onPress={() => setUserData({ ...userData, workoutLocation: loc.id })}
                            >
                                <Icon size={32} color={isSelected ? theme.colors.primary : theme.colors.textMuted} />
                                <Text style={[styles.locationCardText, isSelected && styles.locationCardTextActive]}>
                                    {loc.label}
                                </Text>
                                {isSelected && (
                                    <View style={styles.locationCheckBadge}>
                                        <CheckCircle size={12} color={theme.colors.background} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Equipment Selection */}
                <View style={styles.equipmentSection}>
                    <Text style={styles.sectionTitle}>What do you have access to?</Text>
                    <View style={styles.equipmentGrid}>
                        {equipmentList.map((item) => {
                            const isSelected = userData.equipment.includes(item.id);
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[
                                        styles.chip,
                                        isSelected && styles.chipActive
                                    ]}
                                    onPress={() => toggleEquipment(item.id)}
                                >
                                    {isSelected && <CheckCircle size={14} color={theme.colors.background} style={{ marginRight: 4 }} />}
                                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Duration Selection */}
                <View style={styles.durationSection}>
                    <Text style={styles.sectionTitle}>Preferred duration?</Text>
                    <View style={styles.durationRow}>
                        {durations.map((d) => (
                            <TouchableOpacity
                                key={d}
                                style={[
                                    styles.durationBtn,
                                    userData.preferredDuration === d && styles.durationBtnActive
                                ]}
                                onPress={() => setUserData({ ...userData, preferredDuration: d })}
                            >
                                <Text style={[
                                    styles.durationBtnText,
                                    userData.preferredDuration === d && styles.durationBtnTextActive
                                ]}>
                                    {d} min
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        );
    };

    const renderAnalyzingOverlay = () => (
        <View style={styles.analyzingOverlay}>
            <View style={styles.analyzingContent}>
                <Activity size={64} color={theme.colors.primary} />
                <Text style={styles.analyzingTitle}>AI Analysis in Progress</Text>
                <Text style={styles.analyzingSubtitle}>
                    Crafting your peak physique roadmap...{"\n"}
                    <Text style={{ fontSize: 12, opacity: 0.8 }}>This usually takes about 30-60 seconds.</Text>
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {renderHeader()}

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {step === 1 && renderNameStep()}
                    {step === 2 && renderGoalStep()}
                    {step === 3 && renderBodyDetailsStep()}
                    {step === 4 && renderTargetWeightStep()}
                    {step === 5 && renderFocusAreasStep()}
                    {step === 6 && renderHealthConditionsStep()}
                    {step === 7 && renderActivityLevelStep()}
                    {step === 8 && renderDietPreferenceStep()}
                    {step === 9 && renderWorkoutPreferenceStep()}
                    {step === 10 && <AIGenerationStep theme={theme} onComplete={nextStep} />}
                </ScrollView>

                <View style={styles.footer}>
                    {step < 10 && !isAnalyzing && (
                        <TouchableOpacity
                            style={[styles.nextButton, isProcessing && { opacity: 0.7 }]}
                            onPress={nextStep}
                            disabled={isProcessing}
                        >
                            <Text style={styles.nextButtonText}>Next</Text>
                            <ArrowRight size={20} color={theme.colors.background} />
                        </TouchableOpacity>
                    )}
                </View>
            </KeyboardAvoidingView>
            {isAnalyzing && renderAnalyzingOverlay()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    textInput: {
        backgroundColor: `${theme.colors.surface}80`,
        borderWidth: 1,
        borderColor: `${theme.colors.textMuted}20`,
        borderRadius: 16,
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: '500',
        padding: 16,
        paddingHorizontal: 20,
    },
    header: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: Platform.OS === 'android' ? 24 : 0,
        paddingBottom: theme.spacing.md,
        gap: 12,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 48,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerStepText: {
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: '600',
    },
    headerPercentText: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: 'bold',
    },
    progressContainer: {
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: theme.colors.primary,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: theme.spacing.xl,
        paddingBottom: 40,
    },
    stepContainer: {
        flex: 1,
        paddingTop: 12,
    },
    headerSection: {
        marginBottom: 24,
    },
    brandingContainer: {
        marginBottom: 12,
    },
    brandingText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
        fontSize: 18,
        letterSpacing: 1,
        opacity: 0.6,
    },
    title: {
        fontSize: 34,
        fontWeight: 'bold',
        color: theme.colors.text,
        lineHeight: 42,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.textMuted,
        marginTop: 8,
        lineHeight: 22,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    valueHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    valueText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    unitText: {
        fontSize: 10,
        fontWeight: 'normal',
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
    },
    formSection: {
        gap: 20,
        marginBottom: 32,
    },
    inputLabel: {
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: -12,
        marginLeft: 4,
    },
    inputWrapper: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: theme.roundness.lg,
        paddingHorizontal: theme.spacing.lg,
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(19, 236, 91, 0.2)',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 18,
        color: theme.colors.text,
        fontWeight: '500',
    },
    greetingCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: theme.roundness.xl,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.15)',
        position: 'relative',
        overflow: 'hidden',
    },
    greetingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    greetingBadge: {
        color: theme.colors.primary,
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    greetingIconBg: {
        position: 'absolute',
        right: -10,
        top: -10,
    },
    greetingTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 4,
    },
    greetingSubtitle: {
        fontSize: 14,
        color: theme.colors.textMuted,
        lineHeight: 18,
    },
    blob: {
        position: 'absolute',
        bottom: -20,
        left: -20,
        width: 80,
        height: 80,
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        borderRadius: 40,
        zIndex: -1,
    },
    personalityContainer: {
        height: 160,
        borderRadius: theme.roundness.xl,
        overflow: 'hidden',
        marginTop: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    personalityImage: {
        width: '100%',
        height: '100%',
    },
    personalityOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    personalityBadge: {
        position: 'absolute',
        bottom: 12,
        left: 12,
    },
    personalityText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
        fontSize: 10,
        letterSpacing: 2,
    },
    goalsGrid: {
        gap: 16,
    },
    goalCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: theme.roundness.lg,
        borderWidth: 1.5,
        borderColor: 'rgba(19, 236, 91, 0.15)',
        overflow: 'hidden',
        minHeight: 100,
    },
    selectedGoalCard: {
        backgroundColor: 'rgba(19, 236, 91, 0.12)',
        borderColor: theme.colors.primary,
        borderWidth: 2,
    },
    goalCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        zIndex: 2,
    },
    goalIconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.2)',
    },
    selectedGoalIconWrapper: {
        backgroundColor: theme.colors.primary,
    },
    goalTextWrapper: {
        flex: 1,
        marginLeft: 16,
    },
    goalTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 2,
    },
    goalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    popularBadge: {
        backgroundColor: 'rgba(19, 236, 91, 0.2)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    popularBadgeText: {
        color: theme.colors.primary,
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    goalDescription: {
        fontSize: 13,
        color: theme.colors.textMuted,
        lineHeight: 16,
    },
    checkWrapper: {
        marginLeft: 8,
    },
    goalCardBgWrapper: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    goalCardBg: {
        width: '45%',
        height: '100%',
        opacity: 0.15,
    },
    goalCardBgOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
    },
    genderGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    genderCard: {
        flex: 1,
        height: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: theme.roundness.lg,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        gap: 8,
    },
    selectedGenderCard: {
        borderColor: theme.colors.primary,
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
    },
    genderLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.textMuted,
    },
    selectedGenderLabel: {
        color: theme.colors.primary,
    },
    sliderCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: theme.roundness.lg,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    slider: {
        width: '100%',
        height: 40,
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    sliderLabel: {
        fontSize: 10,
        color: theme.colors.textMuted,
        fontWeight: 'bold',
    },
    unitToggle: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 2,
        borderRadius: 8,
    },
    unitButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    unitButtonActive: {
        backgroundColor: theme.colors.surface,
    },
    unitButtonText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: theme.colors.textMuted,
    },
    unitButtonTextActive: {
        color: theme.colors.text,
    },
    precisionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        marginBottom: 16,
    },
    precisionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    precisionIndicator: {
        alignItems: 'center',
    },
    precisionLine: {
        width: 4,
        height: 40,
        backgroundColor: theme.colors.primary,
        borderRadius: 2,
        marginBottom: 8,
    },
    precisionText: {
        fontSize: 10,
        color: theme.colors.textMuted,
        fontWeight: 'bold',
    },
    blur1: {
        position: 'absolute',
        top: '25%',
        right: -80,
        width: 160,
        height: 160,
        backgroundColor: 'rgba(19, 236, 91, 0.04)',
        borderRadius: 80,
        zIndex: -1,
    },
    blur2: {
        position: 'absolute',
        bottom: '25%',
        left: -80,
        width: 160,
        height: 160,
        backgroundColor: 'rgba(19, 236, 91, 0.04)',
        borderRadius: 80,
        zIndex: -1,
    },
    footer: {
        padding: theme.spacing.xl,
        paddingBottom: Platform.OS === 'ios' ? 32 : 16,
        backgroundColor: theme.colors.background,
    },
    nextButton: {
        backgroundColor: theme.colors.primary,
        height: 60,
        borderRadius: theme.roundness.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        elevation: 4,
    },
    nextButtonText: {
        color: theme.colors.background,
        fontSize: 18,
        fontWeight: 'bold',
    },
    placeholder: {
        padding: 40,
        alignItems: 'center',
    },
    placeholderText: {
        color: theme.colors.textMuted,
        fontSize: 18,
    },
    rulerContainer: {
        width: '100%',
        height: 100,
        justifyContent: 'center',
        position: 'relative',
        marginTop: 20,
    },
    rulerVisual: {
        position: 'absolute',
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        bottom: 20,
    },
    rulerLine: {
        width: 2,
        height: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 1,
    },
    rulerPointer: {
        position: 'absolute',
        top: 0,
        left: '50%',
        marginLeft: -12,
        zIndex: 5,
    },
    insightCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(19, 236, 91, 0.05)',
        borderRadius: theme.roundness.lg,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.1)',
        alignItems: 'center',
        gap: 12,
        width: '100%',
    },
    insightIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    insightText: {
        flex: 1,
        fontSize: 12,
        color: theme.colors.textMuted,
        lineHeight: 18,
    },
    focusGrid: {
        gap: 16,
        marginTop: 24,
    },
    focusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: theme.roundness.lg,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        gap: 16,
        position: 'relative',
    },
    focusCardActive: {
        borderColor: theme.colors.primary,
        backgroundColor: 'rgba(19, 236, 91, 0.05)',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 2,
    },
    focusIconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    focusIconWrapperActive: {
        backgroundColor: 'rgba(19, 236, 91, 0.15)',
    },
    focusCardText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.textMuted,
    },
    focusCardTextActive: {
        color: theme.colors.text,
    },
    focusCheckCircle: {
        position: 'absolute',
        right: 16,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    conditionsList: {
        gap: 12,
        marginTop: 24,
    },
    conditionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: theme.roundness.lg,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
    conditionItemActive: {
        borderColor: theme.colors.primary,
        backgroundColor: 'rgba(19, 236, 91, 0.08)',
    },
    conditionLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.textMuted,
    },
    conditionLabelActive: {
        color: theme.colors.text,
    },
    radioUnchecked: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    safetyCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(19, 236, 91, 0.05)',
        borderRadius: theme.roundness.lg,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.2)',
        alignItems: 'center',
        gap: 16,
        marginTop: 24,
    },
    safetyIconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    safetyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 2,
    },
    safetyText: {
        fontSize: 13,
        color: theme.colors.textMuted,
        lineHeight: 18,
    },
    analyzingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    analyzingContent: {
        alignItems: 'center',
        gap: 20,
    },
    analyzingTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        textAlign: 'center',
    },
    analyzingSubtitle: {
        fontSize: 16,
        color: theme.colors.textMuted,
        textAlign: 'center',
    },
    activityList: {
        gap: 16,
        marginTop: 24,
    },
    activityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: theme.roundness.lg,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        gap: 16,
    },
    activityCardActive: {
        borderColor: theme.colors.primary,
        backgroundColor: 'rgba(19, 236, 91, 0.05)',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 2,
    },
    activityIconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activityIconWrapperActive: {
        backgroundColor: 'rgba(19, 236, 91, 0.15)',
    },
    activityCardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.textMuted,
    },
    activityCardTitleActive: {
        color: theme.colors.text,
    },
    activityCardSubtitle: {
        fontSize: 13,
        color: theme.colors.textMuted,
    },
    radioCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioCircleActive: {
        borderColor: theme.colors.primary,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: theme.colors.primary,
    },
    frequencySection: {
        marginTop: 32,
    },
    frequencyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    suggestedBadge: {
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.2)',
    },
    suggestedBadgeText: {
        color: theme.colors.primary,
        fontSize: 12,
        fontWeight: 'bold',
    },
    dayButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    dayButton: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    dayButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    dayButtonTextActive: {
        color: theme.colors.background,
    },
    adviceCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(19, 236, 91, 0.05)',
        borderRadius: theme.roundness.lg,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.15)',
        alignItems: 'center',
        gap: 12,
        marginTop: 24,
    },
    adviceText: {
        flex: 1,
        fontSize: 14,
        color: theme.colors.textMuted,
        lineHeight: 20,
        fontStyle: 'italic',
    },
    laterButton: {
        marginTop: 32,
        alignSelf: 'center',
        paddingVertical: 12,
    },
    laterButtonText: {
        color: theme.colors.textMuted,
        fontSize: 16,
        fontWeight: '600',
    },
    dietSection: {
        marginTop: 24,
    },
    dietLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.colors.primary,
        letterSpacing: 1.5,
        marginBottom: 16,
    },
    dietList: {
        gap: 12,
    },
    dietCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: theme.roundness.lg,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        gap: 16,
    },
    dietCardActive: {
        borderColor: theme.colors.primary,
        backgroundColor: 'rgba(19, 236, 91, 0.05)',
    },
    dietIconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dietCardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.textMuted,
    },
    dietCardTitleActive: {
        color: theme.colors.text,
    },
    dietCardSubtitle: {
        fontSize: 12,
        color: theme.colors.textMuted,
        marginTop: 2,
    },
    budgetSection: {
        marginTop: 32,
    },
    budgetRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 6,
        borderRadius: 16,
        gap: 8,
    },
    budgetOption: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
    },
    budgetOptionActive: {
        backgroundColor: theme.colors.primary,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    budgetOptionText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.textMuted,
    },
    budgetOptionTextActive: {
        color: theme.colors.background,
    },
    budgetText: {
        fontSize: 10,
        color: theme.colors.textMuted,
        textAlign: 'center',
        marginTop: 8,
        letterSpacing: 0.5,
    },
    allergiesSection: {
        marginTop: 32,
    },
    allergiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    allergyPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
    allergyPillActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    allergyPillText: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.textMuted,
    },
    allergyPillTextActive: {
        color: theme.colors.background,
        fontWeight: 'bold',
    },
    proteinSection: {
        marginTop: 32,
        marginBottom: 20,
    },
    proteinCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(19, 236, 91, 0.05)',
        borderRadius: theme.roundness.lg,
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.2)',
        gap: 16,
    },
    proteinIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(19, 236, 91, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    proteinTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    proteinSubtitle: {
        fontSize: 12,
        color: theme.colors.textMuted,
        marginTop: 2,
    },
    switchTrack: {
        width: 50,
        height: 28,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 2,
    },
    switchTrackActive: {
        backgroundColor: theme.colors.primary,
    },
    switchThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.text,
        transform: [{ translateX: 0 }],
    },
    switchThumbActive: {
        transform: [{ translateX: 22 }],
    },
    locationGrid: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    locationCard: {
        flex: 1,
        aspectRatio: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: theme.roundness.lg,
        borderWidth: 2,
        borderColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    locationCardActive: {
        borderColor: theme.colors.primary,
        backgroundColor: 'rgba(19, 236, 91, 0.05)',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 5,
    },
    locationCardText: {
        color: theme.colors.textMuted,
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 8,
    },
    locationCardTextActive: {
        color: theme.colors.text,
    },
    locationCheckBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    equipmentSection: {
        marginTop: 40,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 16,
    },
    equipmentGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(19, 236, 91, 0.05)',
    },
    chipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    chipText: {
        color: '#f1f5f9',
        fontSize: 12,
        fontWeight: 'bold',
    },
    chipTextActive: {
        color: theme.colors.background,
    },
    durationSection: {
        marginTop: 40,
        paddingBottom: 20,
    },
    durationRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 4,
        borderRadius: 16,
        gap: 4,
    },
    durationBtn: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 12,
    },
    durationBtnActive: {
        backgroundColor: theme.colors.primary,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    durationBtnText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: theme.colors.textMuted,
    },
    durationBtnTextActive: {
        color: theme.colors.background,
    },
    aiHeader: {
        marginTop: 20,
        alignItems: 'center',
    },
    aiUpperTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
        letterSpacing: 4,
    },
    circularContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        height: 250,
        position: 'relative',
    },
    glowEffect: {
        position: 'absolute',
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(19, 236, 91, 0.2)',
        filter: 'blur(40px)',
    },
    progressCenter: {
        position: 'absolute',
        width: 150,
        height: 150,
        alignItems: 'center',
        justifyContent: 'center',
    },
    innerCircle: {
        width: 130,
        height: 130,
        borderRadius: 65,
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.2)',
        backgroundColor: 'rgba(16, 34, 22, 0.5)',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerImage: {
        width: '100%',
        height: '100%',
        opacity: 0.8,
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(16, 34, 22, 0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    percentageText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: theme.colors.primary,
        marginTop: 20,
        textShadowColor: 'rgba(19, 236, 91, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    statusHeader: {
        alignItems: 'center',
        marginTop: 60,
    },
    statusTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: theme.colors.text,
        textAlign: 'center',
        lineHeight: 40,
    },
    statusSubtitle: {
        fontSize: 16,
        color: theme.colors.textMuted,
        marginTop: 12,
        textAlign: 'center',
    },
    aiStepsCard: {
        backgroundColor: 'rgba(19, 236, 91, 0.05)',
        borderRadius: 20,
        padding: 24,
        marginTop: 40,
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.1)',
        gap: 16,
    },
    aiStepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    aiCheckIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    aiRunningIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    aiRunningDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.primary,
    },
    aiPendingIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    aiStepText: {
        fontSize: 16,
        color: theme.colors.textMuted,
        fontWeight: '500',
    },
    aiStepTextActive: {
        fontSize: 16,
        color: theme.colors.text,
        fontWeight: 'bold',
    },
    runningBadge: {
        marginLeft: 'auto',
        color: theme.colors.primary,
        fontSize: 12,
        fontWeight: 'bold',
    },
    insightFooter: {
        alignItems: 'center',
        marginTop: 'auto',
        paddingBottom: 40,
    },
    insightBadge: {
        flexDirection: 'row',
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.2)',
        gap: 8,
        marginBottom: 16,
    },
    insightBadgeText: {
        color: theme.colors.primary,
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    insightQuote: {
        color: theme.colors.textMuted,
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
    },
});

export default OnboardingScreen;
