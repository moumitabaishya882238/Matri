import React, { useContext, useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { AuthContext } from '../../context/AuthContext';

const LoginScreen = ({ navigation }) => {
    const { loginWithGoogle } = useContext(AuthContext);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = async () => {
        setIsLoggingIn(true);
        try {
            await loginWithGoogle();
            // Note: We DO NOT navigate manually. 
            // AppNavigator will automatically switch to MainTabs when 'user' state populates.
        } catch (error) {
            Alert.alert("Login Failed", "There was an error connecting to Google or the MATRI backend.");
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to MATRI</Text>
            <Text style={styles.subtitle}>Your AI Postpartum Companion</Text>

            <View style={styles.buttonContainer}>
                {isLoggingIn ? (
                    <ActivityIndicator size="large" color="#D4A373" />
                ) : (
                    <Button title="Login with Google" onPress={handleLogin} color="#4285F4" />
                )}
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
