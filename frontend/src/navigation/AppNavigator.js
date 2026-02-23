import React, { useContext, useEffect } from 'react';
import { View, ActivityIndicator, TouchableOpacity, Text, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthContext } from '../context/AuthContext';
import NetInfo from '@react-native-community/netinfo';
import SyncService from '../services/SyncService';

import LoginScreen from '../screens/Auth/LoginScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import ChatScreen from '../screens/Chat/ChatScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
    const { logout } = useContext(AuthContext);

    const handleLogout = () => {
        Alert.alert(
            "Secure Logout",
            "Are you sure you want to log out of your MATRI portal?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Yes, Log Out", style: "destructive", onPress: logout }
            ]
        );
    };

    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#0077CE',
                tabBarInactiveTintColor: '#64748B',
                tabBarIcon: () => null, // Explicitly return null to remove the missing icon cross
                tabBarLabelStyle: {
                    fontSize: 16,
                    fontWeight: '700',
                    textAlign: 'center'
                },
                tabBarStyle: {
                    height: 60,
                    justifyContent: 'center',
                    alignItems: 'center'
                },
                tabBarItemStyle: {
                    justifyContent: 'center',
                },
                headerRight: () => (
                    <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
                        <Text style={{ color: '#EF5350', fontWeight: 'bold' }}>Log Out</Text>
                    </TouchableOpacity>
                ),
            }}
        >
            <Tab.Screen name="Dashboard" component={HomeScreen} options={{ title: 'Clinical Dashboard' }} />
            <Tab.Screen name="Chat" component={ChatScreen} options={{ title: 'Daily Check-in' }} />
        </Tab.Navigator>
    );
};

const AppNavigator = () => {
    const { user, isLoading } = useContext(AuthContext);

    // Global background sync listener
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            // Only attempt sync if we just reconnected AND the user is securely logged in
            if (state.isConnected && user) {
                console.log('📶 Active Network Detected. Triggering Global SyncEngine...');
                SyncService.syncPendingLogs();
            }
        });
        return () => unsubscribe();
    }, [user]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#D4A373" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    <Stack.Screen name="Main" component={MainTabs} />
                ) : (
                    <Stack.Screen name="Login" component={LoginScreen} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
