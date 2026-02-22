import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import LoginScreen from '../screens/Auth/LoginScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import ChatScreen from '../screens/Chat/ChatScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#D4A373',
                tabBarInactiveTintColor: 'gray',
            }}
        >
            <Tab.Screen name="Dashboard" component={HomeScreen} options={{ title: 'Home' }} />
            <Tab.Screen name="Chat" component={ChatScreen} options={{ title: 'Daily Check-in' }} />
        </Tab.Navigator>
    );
};

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Home" component={MainTabs} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
