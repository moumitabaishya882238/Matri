import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, TouchableOpacity, PermissionsAndroid } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Tts from 'react-native-tts';
import AnimatedFace from '../../components/AnimatedFace';

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
    const flatListRef = useRef();
    const audioRecorderPlayer = useRef(AudioRecorderPlayer).current;

    // One-time setup & configure on mount
    useEffect(() => {
        configureTts();

        const ts = Tts.addEventListener('tts-start', event => {
            console.log('TTS Started', event);
            setIsSpeaking(true);
        });
        const tf = Tts.addEventListener('tts-finish', event => {
            console.log('TTS Finished', event);
            setIsSpeaking(false);
        });
        const te = Tts.addEventListener('tts-error', event => {
            console.warn('TTS Error', event);
            setIsSpeaking(false);
        });

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

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMessage = { id: Date.now().toString(), text: inputText, sender: 'Mother' };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            const response = await client.post('/chat', { message: userMessage.text });
            const botMessage = { id: (Date.now() + 1).toString(), text: response.data.reply, sender: 'MATRI' };
            setMessages(prev => [...prev, botMessage]);
            Tts.speak(response.data.reply);
        } catch (error) {
            console.error(error);
            const errorMessage = { id: (Date.now() + 1).toString(), text: "Sorry, I had trouble processing that. Could you try again?", sender: 'MATRI' };
            setMessages(prev => [...prev, errorMessage]);
            Tts.speak(errorMessage.text);
        } finally {
            setIsLoading(false);
            // Wait a tick for render, then scroll to bottom
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
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
        Tts.stop(); // Stop any ongoing nurse speech
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
        setIsLoading(true);

        const tempMsgId = Date.now().toString();
        setMessages(prev => [...prev, { id: tempMsgId, text: "🎤 (Voice Message)", sender: 'Mother' }]);

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

            // Update user message with transcript
            setMessages(prev => prev.map(msg =>
                msg.id === tempMsgId ? { ...msg, text: `🎤 "${response.data.transcription}"` } : msg
            ));

            const botText = response.data.reply;
            Tts.speak(botText);

            const botMessage = { id: (Date.now() + 1).toString(), text: botText, sender: 'MATRI' };
            setMessages(prev => [...prev, botMessage]);

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
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Daily Consultation</Text>
                <TouchableOpacity onPress={handleReset} style={styles.resetButton} disabled={isLoading}>
                    <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.faceContainer}>
                <AnimatedFace isSpeaking={isSpeaking} emotion="neutral" />
            </View>

            <FlatList
                ref={flatListRef}
                data={messages.filter(msg => msg.sender !== 'MATRI')}
                keyExtractor={(item) => item.id}
                renderItem={renderBubble}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />

            {isLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#D4A373" />
                    <Text style={styles.loadingText}>MATRI is thinking...</Text>
                </View>
            )}

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type or hold Mic..."
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
                    <Text style={styles.micButtonText}>{isRecording ? '🔴' : '🎤'}</Text>
                </TouchableOpacity>

                <Button title="Send" onPress={handleSend} disabled={isLoading || isRecording || !inputText.trim()} color="#D4A373" />
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAF9F6',
    },
    faceContainer: {
        flex: 1, // Allow face to grow
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        marginTop: Platform.OS === 'ios' ? 40 : 20, // push down below status bar slightly if no proper header
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333'
    },
    resetButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#ffebe6',
        borderRadius: 15,
    },
    resetButtonText: {
        color: '#ff4d4f',
        fontSize: 14,
        fontWeight: '600'
    },
    listContent: {
        padding: 15,
        paddingBottom: 20
    },
    systemBubbleContainer: {
        alignItems: 'center',
        marginVertical: 10,
    },
    systemText: {
        color: '#999',
        fontSize: 12,
        fontStyle: 'italic',
    },
    bubbleContainer: {
        marginVertical: 5,
        flexDirection: 'row',
    },
    botBubbleContainer: {
        justifyContent: 'flex-start',
    },
    userBubbleContainer: {
        justifyContent: 'flex-end',
    },
    bubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
    },
    botBubble: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eee',
        borderBottomLeftRadius: 4,
    },
    userBubble: {
        backgroundColor: '#D4A373',
        borderBottomRightRadius: 4,
    },
    bubbleText: {
        fontSize: 16,
        lineHeight: 22,
    },
    botText: {
        color: '#333',
    },
    userText: {
        color: '#fff',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        paddingLeft: 20,
    },
    loadingText: {
        marginLeft: 10,
        color: '#999',
        fontSize: 14,
        fontStyle: 'italic',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderColor: '#eee',
        alignItems: 'center'
    },
    input: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        maxHeight: 100,
        fontSize: 16,
        marginRight: 10
    },
    micButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    micButtonRecording: {
        backgroundColor: '#ffebe6',
        transform: [{ scale: 1.1 }]
    },
    micButtonText: {
        fontSize: 20
    }
});

export default ChatScreen;
