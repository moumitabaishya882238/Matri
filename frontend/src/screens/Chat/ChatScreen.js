import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, TouchableOpacity, PermissionsAndroid, Modal, StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import client from '../../api/client';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Tts from 'react-native-tts';
import AnimatedFace from '../../components/AnimatedFace';
import { useNetInfo } from '@react-native-community/netinfo';
import OfflineStorageService from '../../services/OfflineStorageService';
import { calculateDailyRisk } from '../../utils/localRiskCalculator';

// Premium Medical Color Palette
const COLORS = {
    primary: '#0077CE',
    secondary: '#E8F4F8',
    accent: '#48BCA2',
    warning: '#FF8A65',
    danger: '#EF5350',
    textDark: '#1E293B',
    textMuted: '#64748B',
    background: '#F8FAFC',
    white: '#FFFFFF',
    border: '#E2E8F0',
};

// Delay configuration until after initialization
const configureTts = async () => {
    try {
        await Tts.getInitStatus();
        await Tts.setDefaultLanguage('en-US');
        await Tts.setDefaultRate(0.5);
        await Tts.setDefaultPitch(1.2);
        console.log('✅ TTS engine initialized & configured successfully.');
    } catch (err) {
        if (err.code === 'no_engine') {
            Tts.requestInstallEngine();
        } else {
            console.warn('❌ TTS Initialization failed:', err);
        }
    }
};

const INITIAL_MESSAGE = { id: '1', text: "Hello Mother! How are you feeling today?", sender: 'MATRI' };

const ChatScreen = () => {
    const [messages, setMessages] = useState([INITIAL_MESSAGE]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [showEmergency, setShowEmergency] = useState(false);
    const flatListRef = useRef();
    const audioRecorderPlayer = useRef(AudioRecorderPlayer).current;
    const insets = useSafeAreaInsets();

    const netInfo = useNetInfo();
    const isOffline = netInfo.isConnected === false;
    const [offlineStep, setOfflineStep] = useState(0);
    const [offlineData, setOfflineData] = useState({});

    const OFFLINE_QUESTIONS = [
        "It looks like we are offline. Let's do a quick structured check-in. What was your blood pressure today? (For example, type 120/80)",
        "How would you describe your bleeding level today? (Type: none, mild, moderate, or heavy)",
        "Do you have a fever? (Type: yes or no)",
        "What is your pain level on a scale of 0 to 10?",
        "How many hours did you sleep last night?",
        "How is your mood today on a scale of 1 to 10?",
        "Thank you. Your health check-in is saved securely on your device and will sync automatically when your internet connection returns. You are safe to close the app."
    ];

    // One-time setup & configure on mount
    useEffect(() => {
        configureTts();

        const ts = Tts.addEventListener('tts-start', event => setIsSpeaking(true));
        const tf = Tts.addEventListener('tts-finish', event => setIsSpeaking(false));
        const te = Tts.addEventListener('tts-error', event => setIsSpeaking(false));

        return () => {
            ts.remove();
            tf.remove();
            te.remove();
        };
    }, []);

    // Speak initial message on screen focus
    useFocusEffect(
        useCallback(() => {
            let isActive = true;
            Tts.getInitStatus().then(() => {
                if (isActive) Tts.speak(INITIAL_MESSAGE.text);
            }).catch(err => console.log('TTS Focus Init Error:', err));

            return () => {
                isActive = false;
                Tts.stop();
            };
        }, [])
    );

    const handleOfflineFlow = async (text) => {
        let currentData = { ...offlineData };
        let nextStep = offlineStep;

        // Parse current answer
        if (offlineStep === 0) { // BP
            const parts = text.split('/');
            if (parts.length === 2) {
                currentData.bp_systolic = parseInt(parts[0]);
                currentData.bp_diastolic = parseInt(parts[1]);
            }
            nextStep = 1;
        } else if (offlineStep === 1) { // Bleeding
            currentData.bleeding = text.toLowerCase().trim();
            nextStep = 2;
        } else if (offlineStep === 2) { // Fever
            currentData.fever = text.toLowerCase().includes('yes') ? 'yes' : 'no';
            nextStep = 3;
        } else if (offlineStep === 3) { // Pain
            currentData.pain = parseInt(text) || 0;
            nextStep = 4;
        } else if (offlineStep === 4) { // Sleep
            currentData.sleep_hours = parseInt(text) || 0;
            nextStep = 5;
        } else if (offlineStep === 5) { // Mood
            currentData.mood_score = parseInt(text) || 0;

            // Finish offline checkin
            nextStep = 6;

            // Calculate Risk
            const risk = calculateDailyRisk(currentData);
            if (risk === 'Red') setShowEmergency(true);

            // Save local log securely
            await OfflineStorageService.saveLogLocal(currentData);
        }

        setOfflineData(currentData);
        setOfflineStep(nextStep);

        const botReply = OFFLINE_QUESTIONS[nextStep === 6 ? 6 : nextStep];
        const botMessage = { id: (Date.now() + 1).toString(), text: botReply, sender: 'MATRI' };
        setMessages(prev => [...prev, botMessage]);
        Tts.speak(botReply);
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userText = inputText.trim();
        const userMessage = { id: Date.now().toString(), text: userText, sender: 'Mother' };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');

        if (isOffline) {
            handleOfflineFlow(userText);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            return;
        }

        setIsLoading(true);

        try {
            const response = await client.post('/chat', { message: userText });
            const botMessage = { id: (Date.now() + 1).toString(), text: response.data.reply, sender: 'MATRI' };
            setMessages(prev => [...prev, botMessage]);
            Tts.speak(response.data.reply);

            if (response.data.isEmergency) setShowEmergency(true);
        } catch (error) {
            console.error(error);
            const errorMessage = { id: (Date.now() + 1).toString(), text: "Sorry, I had trouble processing that. Could you try again?", sender: 'MATRI' };
            setMessages(prev => [...prev, errorMessage]);
            Tts.speak(errorMessage.text);
        } finally {
            setIsLoading(false);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    const handleReset = async () => {
        Alert.alert(
            "Restart Check-in",
            "Are you sure you want to completely erase today's health check-in and start over?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Yes, Restart",
                    style: "destructive",
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            await client.post('/chat/reset');
                            setMessages([
                                INITIAL_MESSAGE,
                                { id: Date.now().toString(), text: "--- Today's Check-in Restarted ---", sender: 'System' }
                            ]);
                            Tts.stop();
                            Tts.speak(INITIAL_MESSAGE.text);
                        } catch (error) {
                            Alert.alert("Error", "Could not reset the check-in. Try again.");
                            console.error(error);
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const checkAndroidPermissions = async () => {
        if (Platform.OS === 'android') {
            try {
                const grants = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                ]);
                return (
                    grants['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
                    grants['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
                    grants['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED
                );
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true;
    };

    const handleStartRecord = async () => {
        const hasPermission = await checkAndroidPermissions();
        if (!hasPermission) {
            Alert.alert("Permission Denied", "MATRI needs microphone access to hear you.");
            return;
        }
        setIsRecording(true);
        Tts.stop();
        await audioRecorderPlayer.startRecorder();
    };

    const handleStopRecord = async () => {
        if (!isRecording) return;
        setIsRecording(false);
        const result = await audioRecorderPlayer.stopRecorder();
        audioRecorderPlayer.removeRecordBackListener();

        await sendAudioMessage(result);
    };

    const sendAudioMessage = async (audioUri) => {
        if (isOffline) {
            Alert.alert("Offline Mode", "Voice processing requires internet. Please type your responses manually for the offline check-in.");
            return;
        }

        setIsLoading(true);
        const tempMsgId = Date.now().toString();
        setMessages(prev => [...prev, { id: tempMsgId, text: "(Processing Voice...)", sender: 'Mother' }]);

        try {
            const formData = new FormData();
            formData.append('audio', {
                uri: Platform.OS === 'android' ? audioUri : audioUri.replace('file://', ''),
                type: 'audio/mp4',
                name: 'record.mp4',
            });

            const response = await client.post('/chat/voice', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setMessages(prev => prev.map(msg =>
                msg.id === tempMsgId ? { ...msg, text: `🎙️ "${response.data.transcription}"` } : msg
            ));

            const botText = response.data.reply;
            Tts.speak(botText);

            const botMessage = { id: (Date.now() + 1).toString(), text: botText, sender: 'MATRI' };
            setMessages(prev => [...prev, botMessage]);

            if (response.data.isEmergency) setShowEmergency(true);

        } catch (error) {
            console.error(error);
            const errorMessage = { id: (Date.now() + 1).toString(), text: "Sorry, I had trouble processing your voice. Could you try again?", sender: 'MATRI' };
            setMessages(prev => [...prev, errorMessage]);
            Tts.speak(errorMessage.text);
        } finally {
            setIsLoading(false);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    const renderBubble = ({ item }) => {
        if (item.sender === 'System') {
            return (
                <View style={styles.systemBubbleContainer}>
                    <Text style={styles.systemText}>{item.text}</Text>
                </View>
            );
        }

        const isBot = item.sender === 'MATRI';
        return (
            <View style={[styles.bubbleContainer, isBot ? styles.botBubbleContainer : styles.userBubbleContainer]}>
                <View style={[styles.bubble, isBot ? styles.botBubble : styles.userBubble]}>
                    <Text style={[styles.bubbleText, isBot ? styles.botText : styles.userText]}>{item.text}</Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
                <View>
                    <Text style={styles.headerTitle}>Clinical Check-in</Text>
                    {isOffline && <Text style={{ color: COLORS.warning, fontSize: 13, fontWeight: '700', marginTop: 2 }}>⚠️ Offline Mode Active</Text>}
                </View>
                <TouchableOpacity onPress={handleReset} style={styles.resetButton} disabled={isLoading}>
                    <Text style={styles.resetButtonText}>Reset Session</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.faceContainer}>
                <AnimatedFace isSpeaking={isSpeaking} emotion="neutral" />
            </View>

            <FlatList
                style={{ flex: 1 }}
                ref={flatListRef}
                data={messages.filter(msg => msg.sender !== 'MATRI')}
                keyExtractor={(item) => item.id}
                renderItem={renderBubble}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />

            {isLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Synthesizing clinical response...</Text>
                </View>
            )}

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type or hold Mic..."
                    placeholderTextColor={COLORS.textMuted}
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                />

                <TouchableOpacity
                    onPressIn={handleStartRecord}
                    onPressOut={handleStopRecord}
                    style={[styles.micButton, isRecording && styles.micButtonRecording]}
                    disabled={isLoading}
                >
                    <Text style={{ fontSize: 20 }}>{isRecording ? '🔴' : '🎤'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.sendButton, (!inputText.trim() || isLoading || isRecording) && styles.sendButtonDisabled]}
                    onPress={handleSend}
                    disabled={isLoading || isRecording || !inputText.trim()}
                >
                    <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
            </View>

            {/* Emergency Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showEmergency}
                onRequestClose={() => setShowEmergency(false)}
            >
                <View style={styles.emergencyOverlay}>
                    <View style={styles.emergencyCard}>
                        <View style={styles.emergencyIconBg}>
                            <Text style={{ fontSize: 32 }}>🚨</Text>
                        </View>
                        <Text style={styles.emergencyTitle}>CRITICAL ATTENTION</Text>
                        <Text style={styles.emergencyText}>
                            MATRI has detected critical health symptoms or unstable vitals based on your responses.
                        </Text>
                        <Text style={[styles.emergencyText, { fontWeight: 'bold' }]}>
                            Please contact your healthcare provider or proceed to the nearest emergency room immediately.
                        </Text>
                        <TouchableOpacity
                            style={styles.emergencyButton}
                            onPress={() => setShowEmergency(false)}
                        >
                            <Text style={styles.emergencyButtonText}>I Understand and Acknowledge</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    faceContainer: {
        height: 220,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        shadowColor: COLORS.textDark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
        elevation: 2,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textDark,
        letterSpacing: -0.3,
    },
    resetButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#FEF2F2',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FECACA'
    },
    resetButtonText: {
        color: COLORS.danger,
        fontSize: 13,
        fontWeight: '700'
    },
    listContent: {
        padding: 20,
        paddingBottom: 30
    },
    systemBubbleContainer: {
        alignItems: 'center',
        marginVertical: 15,
    },
    systemText: {
        color: COLORS.textMuted,
        fontSize: 12,
        fontStyle: 'italic',
        fontWeight: '600'
    },
    bubbleContainer: {
        marginVertical: 8,
        flexDirection: 'row',
    },
    botBubbleContainer: {
        justifyContent: 'flex-start',
    },
    userBubbleContainer: {
        justifyContent: 'flex-end',
    },
    bubble: {
        maxWidth: '85%',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 20,
        shadowColor: COLORS.textDark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    botBubble: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderBottomLeftRadius: 6,
    },
    userBubble: {
        backgroundColor: COLORS.primary,
        borderBottomRightRadius: 6,
    },
    bubbleText: {
        fontSize: 16,
        lineHeight: 22,
    },
    botText: {
        color: COLORS.textDark,
    },
    userText: {
        color: COLORS.white,
        fontWeight: '500'
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    loadingText: {
        marginLeft: 10,
        color: COLORS.textMuted,
        fontSize: 13,
        fontWeight: '600',
        fontStyle: 'italic',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 15,
        paddingBottom: Platform.OS === 'ios' ? 25 : 15,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        shadowColor: COLORS.textDark,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
        elevation: 10,
    },
    input: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderRadius: 25,
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: 12,
        maxHeight: 120,
        fontSize: 16,
        marginRight: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        minHeight: 45,
    },
    micButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: COLORS.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    micButtonRecording: {
        backgroundColor: '#FEE2E2',
        transform: [{ scale: 1.15 }]
    },
    sendButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 25,
    },
    sendButtonDisabled: {
        backgroundColor: '#94A3B8',
    },
    sendButtonText: {
        color: COLORS.white,
        fontWeight: '700',
        fontSize: 15,
    },
    emergencyOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    emergencyCard: {
        backgroundColor: COLORS.white,
        padding: 30,
        borderRadius: 24,
        alignItems: 'center',
        width: '100%',
        shadowColor: COLORS.danger,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    emergencyIconBg: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emergencyTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.danger,
        marginBottom: 15,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    emergencyText: {
        fontSize: 16,
        color: COLORS.textDark,
        textAlign: 'center',
        marginBottom: 15,
        lineHeight: 24,
    },
    emergencyButton: {
        backgroundColor: COLORS.danger,
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 30,
        marginTop: 15,
        width: '100%',
    },
    emergencyButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '800',
        textAlign: 'center',
    }
});

export default ChatScreen;
