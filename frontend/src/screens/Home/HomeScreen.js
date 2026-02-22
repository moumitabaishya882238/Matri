import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const HomeScreen = ({ navigation }) => {
    const [postpartumDay, setPostpartumDay] = useState(1);
    const [riskColor, setRiskColor] = useState('Green');

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.greeting}>Good Morning, Mother!</Text>
                <Text style={styles.dayText}>Postpartum Day: {postpartumDay}</Text>
            </View>

            <View style={[styles.statusCard, riskColor === 'Green' ? styles.statusGreen : styles.statusOrange]}>
                <Text style={styles.statusText}>Current Status: {riskColor}</Text>
            </View>

            <Button title="Logout" onPress={() => navigation.replace('Login')} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#FAF9F6' // Calm off-white
    },
    header: {
        marginTop: 40,
        marginBottom: 20
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333'
    },
    dayText: {
        fontSize: 16,
        color: '#666',
        marginTop: 5
    },
    statusCard: {
        padding: 20,
        borderRadius: 10,
        marginBottom: 20,
        alignItems: 'center'
    },
    statusGreen: {
        backgroundColor: '#A8D5BA' // Soft Green
    },
    statusOrange: {
        backgroundColor: '#F7C59F' // Soft Orange
    },
    statusText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff'
    }
});

export default HomeScreen;
