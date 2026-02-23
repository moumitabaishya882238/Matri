import React, { createContext, useState, useEffect } from 'react';
import client from '../api/client';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initial load: Configure Google SDK and securely check existing cookie session
    useEffect(() => {
        GoogleSignin.configure({
            webClientId: '942996904541-k2p673855fbfd6djgctne11jlkgd9fo4.apps.googleusercontent.com',
            offlineAccess: true
        });

        checkCurrentUser();
    }, []);

    const checkCurrentUser = async () => {
        try {
            const response = await client.get('/auth/current_user');
            if (response.data && response.data._id) {
                setUser(response.data);
            } else {
                setUser(null);
            }
        } catch (error) {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithGoogle = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();

            // Send the identity token securely to our Express backend
            let token = userInfo.idToken; // Fallback for older SDKs if somehow present

            // Handle v13+ SDK response format natively
            if (userInfo.type === 'success' && userInfo.data) {
                token = userInfo.data.idToken;
            } else if (userInfo.type === 'cancelled' || userInfo.type === 'noSavedCredentialFound') {
                console.log("Google Signin was cancelled or no credential found.");
                return;
            }

            if (!token) {
                throw new Error("No Identity Token found in Google Signin response data.");
            }

            const response = await client.post('/auth/google/verify', {
                idToken: token
            });

            if (response.data.success) {
                setUser(response.data.user);
            }
        } catch (error) {
            console.error("Google Signin Error:", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await client.get('/auth/logout');
        } catch (error) {
            console.log("Backend logout error (safe to ignore):", error.message);
        }

        try {
            const isSignedIn = await GoogleSignin.isSignedIn();
            if (isSignedIn) {
                await GoogleSignin.signOut();
            }
        } catch (error) {
            console.log("Google native signout error:", error);
        }

        // ALWAYS clear local state
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
