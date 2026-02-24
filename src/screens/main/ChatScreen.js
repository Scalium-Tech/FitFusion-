import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Image,
    Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import {
    Send,
    ChevronLeft,
    Bot,
    User,
    Sparkles,
    Info
} from 'lucide-react-native';
import { aiService } from '../../services/aiService';
import { storageService } from '../../services/storageService';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

const ChatScreen = ({ navigation }) => {
    const tabBarHeight = useBottomTabBarHeight();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [chatSession, setChatSession] = useState(null);

    const flatListRef = useRef(null);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setHistoryLoading(true);
        try {
            const [profile, history] = await Promise.all([
                storageService.getUserData(),
                storageService.getChatHistory()
            ]);

            setUserData(profile);

            if (history && history.length > 0) {
                const formattedMessages = history.map(msg => ({
                    id: msg.id,
                    text: msg.content,
                    sender: msg.role === 'user' ? 'user' : 'ai',
                    timestamp: new Date(msg.created_at)
                }));
                setMessages(formattedMessages);
            } else {
                // Default welcome message if no history
                setMessages([{
                    id: 'welcome',
                    text: "Hello! I'm your AI Coach. How can I help you reach your goals today?",
                    sender: 'ai',
                    timestamp: new Date(),
                }]);
            }
        } catch (error) {
            console.error('Error loading chat data:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim() || loading) return;

        const userMessage = {
            id: Date.now().toString(),
            text: inputText.trim(),
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setLoading(true);
        Keyboard.dismiss();

        try {
            // Save user message to Supabase
            await storageService.saveChatMessage({
                role: 'user',
                content: userMessage.text
            });

            let session = chatSession;
            if (!session) {
                session = await aiService.getChatSession(userData);
                setChatSession(session);
            }

            const result = await session.sendMessage(userMessage.text);
            const response = await result.response;
            const aiText = response.text();

            const aiMessage = {
                id: (Date.now() + 1).toString(),
                text: aiText,
                sender: 'ai',
                timestamp: new Date(),
            };

            // Save AI response to Supabase
            await storageService.saveChatMessage({
                role: 'assistant',
                content: aiText
            });

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Chat Error:', error);
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                text: "I'm having a bit of trouble connecting right now. Please try again in a moment!",
                sender: 'ai',
                timestamp: new Date(),
                isError: true
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const renderMessage = ({ item }) => {
        const isAI = item.sender === 'ai';
        return (
            <View style={[
                styles.messageWrapper,
                isAI ? styles.aiWrapper : styles.userWrapper
            ]}>
                {isAI && (
                    <View style={styles.aiAvatar}>
                        <Bot size={16} color={theme.colors.primary} />
                    </View>
                )}
                <View style={[
                    styles.messageBubble,
                    isAI ? styles.aiBubble : styles.userBubble,
                    item.isError && styles.errorBubble
                ]}>
                    <Text style={[
                        styles.messageText,
                        isAI ? styles.aiText : styles.userText
                    ]}>
                        {item.text}
                    </Text>
                    <Text style={styles.timestamp}>
                        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
                {!isAI && (
                    <View style={styles.userAvatar}>
                        <User size={16} color="#fff" />
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View style={styles.headerInfo}>
                    <View style={styles.botIconContainer}>
                        <Sparkles size={18} color={theme.colors.primary} />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>AI Fitness Coach</Text>
                        <View style={styles.statusRow}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusText}>Online & Ready</Text>
                        </View>
                    </View>
                </View>
                <TouchableOpacity style={styles.infoButton}>
                    <Info size={20} color="rgba(255, 255, 255, 0.4)" />
                </TouchableOpacity>
            </View>

            {historyLoading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={{ color: theme.colors.textMuted, marginTop: 10 }}>Loading history...</Text>
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.messageList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />
            )}

            {loading && (
                <View style={styles.aiTyping}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text style={styles.aiTypingText}>Chef AI is thinking...</Text>
                </View>
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                style={{ backgroundColor: theme.colors.background }}
            >
                <View style={[styles.inputArea, { paddingBottom: 10 }]}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Ask about exercises, diet, or tips..."
                            placeholderTextColor="rgba(255, 255, 255, 0.3)"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity
                            style={[
                                styles.sendButton,
                                !inputText.trim() && styles.sendButtonDisabled
                            ]}
                            onPress={handleSend}
                            disabled={!inputText.trim() || loading}
                        >
                            <Send size={20} color={inputText.trim() ? "#000" : "rgba(255, 255, 255, 0.2)"} />
                        </TouchableOpacity>
                    </View>
                </View>
                {/* Dynamic spacer to clear the absolute tab bar when keyboard is closed */}
                <View style={{ height: tabBarHeight }} />
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
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    botIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.primary,
        marginRight: 6,
    },
    statusText: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.4)',
    },
    infoButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageList: {
        padding: 20,
        paddingBottom: 30,
    },
    messageWrapper: {
        flexDirection: 'row',
        marginBottom: 20,
        maxWidth: '85%',
    },
    aiWrapper: {
        alignSelf: 'flex-start',
    },
    userWrapper: {
        alignSelf: 'flex-end',
    },
    aiAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        marginTop: 2,
    },
    userAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        marginTop: 2,
    },
    messageBubble: {
        padding: 12,
        borderRadius: 20,
    },
    aiBubble: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderBottomLeftRadius: 4,
    },
    userBubble: {
        backgroundColor: theme.colors.primary,
        borderBottomRightRadius: 4,
    },
    errorBubble: {
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 107, 0.3)',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    aiText: {
        color: theme.colors.text,
    },
    userText: {
        color: '#000',
        fontWeight: '500',
    },
    timestamp: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.3)',
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    aiTyping: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    aiTypingText: {
        fontSize: 12,
        color: 'rgba(19, 236, 91, 0.6)',
        marginLeft: 8,
    },
    inputArea: {
        padding: 20,
        paddingTop: 10,
        backgroundColor: theme.colors.background,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    input: {
        flex: 1,
        color: theme.colors.text,
        fontSize: 15,
        maxHeight: 100,
        paddingTop: Platform.OS === 'ios' ? 8 : 4,
        paddingBottom: Platform.OS === 'ios' ? 8 : 4,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    sendButtonDisabled: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
});

export default ChatScreen;
