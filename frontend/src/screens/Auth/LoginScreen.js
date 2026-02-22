import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const LoginScreen = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to MATRI</Text>
            <Text style={styles.subtitle}>Your AI Postpartum Companion</Text>

            <View style={styles.buttonContainer}>
                <Button
                    title="Login with Google"
                    onPress={() => {
                        // Note: Real Google Auth requires linking & browser flow.
                        // For now, we'll navigate mockly or open the backend URL.
                        console.log('Google Auth Clicked');
                        // Navigate to home temporarily for skeleton purpose
                        navigation.replace('Home');
                    }}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FAF9F6', // Warm off-white
        padding: 20
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#D4A373', // Soft warm tone
        marginBottom: 10
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 40
    },
    buttonContainer: {
        width: '100%',
        paddingHorizontal: 50
    }
});

export default LoginScreen;
