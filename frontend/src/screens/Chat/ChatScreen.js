import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import client from '../../api/client';

const ChatScreen = () => {
    const [messages, setMessages] = useState([
        { id: '1', text: "Hello Mother! How are you feeling today?", sender: 'MATRI' }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const flatListRef = useRef();

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
        } catch (error) {
            console.error(error);
            const errorMessage = { id: (Date.now() + 1).toString(), text: "Sorry, I had trouble processing that. Could you try again?", sender: 'MATRI' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            // Wait a tick for render, then scroll to bottom
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    };

    const renderBubble = ({ item }) => {
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
            <FlatList
                ref={flatListRef}
                data={messages}
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
                    placeholder="For example: My BP is 120/80..."
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                />
                <Button title="Send" onPress={handleSend} disabled={isLoading} color="#D4A373" />
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAF9F6',
    },
    listContent: {
        padding: 15,
        paddingBottom: 20
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
    }
});

export default ChatScreen;
