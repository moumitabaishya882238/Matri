import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ImageBackground, StatusBar, Platform } from 'react-native';
import { AuthContext } from '../../context/AuthContext';

const COLORS = {
    primary: '#0077CE',
    secondary: '#E8F4F8',
    textDark: '#1E293B',
    textMuted: '#64748B',
    white: '#FFFFFF',
    googleBlue: '#4285F4',
};

const LoginScreen = ({ navigation }) => {
    const { loginWithGoogle } = useContext(AuthContext);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = async () => {
        setIsLoggingIn(true);
        try {
            await loginWithGoogle();
        } catch (error) {
            Alert.alert("Login Failed", "There was an error connecting to Google or the MATRI backend.");
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            <ImageBackground
                source={require('../../assets/images/login_bg.png')}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                <View style={styles.overlay}>

                    <View style={styles.headerContainer}>
                        <Text style={styles.title}>MATRI</Text>
                        <Text style={styles.subtitle}>Your Clinical Postpartum Companion</Text>
                    </View>

                    <View style={styles.bottomContainer}>
                        {isLoggingIn ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={COLORS.primary} />
                                <Text style={styles.loadingText}>Connecting securely...</Text>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.googleButton}
                                onPress={handleLogin}
                                activeOpacity={0.8}
                            >
                                <View style={styles.googleIconPlaceholder}>
                                    <Text style={styles.googleG}>G</Text>
                                </View>
                                <Text style={styles.googleButtonText}>Continue with Google</Text>
                            </TouchableOpacity>
                        )}

                        <Text style={styles.termsText}>
                            By continuing, you agree to our Terms of Service and Privacy Policy. Secure clinical authentication required.
                        </Text>
                    </View>

                </View>
            </ImageBackground>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 25,
        paddingTop: Platform.OS === 'ios' ? 80 : 70,
        paddingBottom: Platform.OS === 'ios' ? 40 : 35,
        backgroundColor: 'rgba(255,255,255, 0.15)', // Very light white tint overlay
    },
    headerContainer: {
        alignItems: 'center',
        marginTop: 10,
    },
    title: {
        fontSize: 48,
        fontWeight: '900',
        color: COLORS.primary,
        letterSpacing: 2,
        textShadowColor: 'rgba(255,255,255,0.9)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 15,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textDark,
        marginTop: 5,
        letterSpacing: 0.5,
        textAlign: 'center',
        textShadowColor: 'rgba(255,255,255,0.9)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 10,
    },
    bottomContainer: {
        width: '100%',
        backgroundColor: COLORS.white,
        padding: 30,
        borderRadius: 28,
        shadowColor: COLORS.textDark,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        alignItems: 'center',
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.googleBlue,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 30,
        width: '100%',
        elevation: 2,
    },
    googleIconPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    googleG: {
        color: COLORS.googleBlue,
        fontWeight: '900',
        fontSize: 18,
    },
    googleButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.white,
        flex: 1,
        textAlign: 'center',
        marginRight: 32, // Balance 
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    loadingText: {
        marginTop: 15,
        color: COLORS.primary,
        fontWeight: '700',
        fontSize: 15,
    },
    termsText: {
        marginTop: 22,
        fontSize: 12,
        color: COLORS.textMuted,
        textAlign: 'center',
        lineHeight: 18,
        fontWeight: '500',
    }
});

export default LoginScreen;
