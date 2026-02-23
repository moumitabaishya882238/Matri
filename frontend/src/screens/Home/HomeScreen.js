import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, Button } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import client from '../../api/client';
import ComfortCard from '../../components/ComfortCard';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);

    useFocusEffect(
        useCallback(() => {
            let isActive = true;
            const fetchDashboard = async () => {
                try {
                    setIsLoading(true);
                    const response = await client.get('/mother/dashboard');
                    if (isActive) {
                        setDashboardData(response.data);
                    }
                } catch (error) {
                    console.error("Failed to load dashboard data", error);
                } finally {
                    if (isActive) setIsLoading(false);
                }
            };
            fetchDashboard();
            return () => { isActive = false; };
        }, [])
    );

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centerAll]}>
                <ActivityIndicator size="large" color="#D4A373" />
                <Text style={{ marginTop: 10, color: '#666' }}>Loading your dashboard...</Text>
            </View>
        );
    }

    if (!dashboardData) {
        return (
            <View style={[styles.container, styles.centerAll]}>
                <Text>Error loading dashboard. Please try again.</Text>
            </View>
        );
    }

    const { mother, currentRisk, latestLog, historicalLogs } = dashboardData;

    // Helper: Map risk string to a nice color code
    const getRiskColorCode = (risk) => {
        if (risk === 'Green') return '#4CAF50';
        if (risk === 'Orange') return '#FF9800';
        if (risk === 'Red') return '#F44336';
        return '#4CAF50'; // Default
    };

    const getRiskMessage = (risk) => {
        if (risk === 'Green') return 'All vitals normal. Doing great! 🌸';
        if (risk === 'Orange') return 'Slight irregularities detected. Please monitor. 🧘‍♀️';
        if (risk === 'Red') return 'Critical vitals detected. Please consult a doctor immediately. 🩺';
        return 'No recent data. Have you chatted with MATRI today?';
    };

    const getMoodEmoji = (score) => {
        if (!score) return '';
        if (score >= 8) return '🥰';
        if (score >= 6) return '😌';
        if (score >= 4) return '😐';
        return '😔';
    };

    const getAffirmation = () => {
        const affirmations = [
            "You are doing an amazing job. Take a deep breath.",
            "Your baby is lucky to have you.",
            "It's okay to ask for help when you need it.",
            "Every day you are getting stronger.",
            "Remember to drink a glass of water right now!"
        ];
        // Pick one pseudo-randomly based on the day of the month
        const dayIndex = new Date().getDate() % affirmations.length;
        return affirmations[dayIndex];
    };

    // Prepare chart data defaults
    let moodChartData = {
        labels: ['No Data'],
        datasets: [{ data: [0] }] // Default to 0
    };

    let bpChartData = {
        labels: ['No Data'],
        legend: ['Systolic', 'Diastolic'],
        datasets: [
            { data: [0], color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})` }, // Red
            { data: [0], color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})` }  // Blue
        ]
    };

    // Populate actual chart data if historical logs exist
    const daysWithData = historicalLogs.filter(log => log.moodScore || log.systolicBP);

    if (daysWithData.length > 0) {
        // Only use the last 7 items to prevent overcrowding
        const recentSubset = daysWithData.slice(-7);

        const labels = recentSubset.map(log => {
            const date = new Date(log.date);
            return `${date.getMonth() + 1}/${date.getDate()}`; // MM/DD format
        });

        // Map data, fill with '0' or last known value ideally if missing, but just skipping handles mostly fine for MVP.
        const moodScores = recentSubset.map(log => log.moodScore || 0);
        const systolic = recentSubset.map(log => log.systolicBP || 0);
        const diastolic = recentSubset.map(log => log.diastolicBP || 0);

        moodChartData = {
            labels: labels.length ? labels : ['Today'],
            datasets: [{ data: moodScores.length ? moodScores : [0] }]
        };

        bpChartData = {
            labels: labels.length ? labels : ['Today'],
            legend: ['Systolic', 'Diastolic'],
            datasets: [
                { data: systolic.length ? systolic : [0], color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})` },
                { data: diastolic.length ? diastolic : [0], color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})` }
            ]
        };
    }

    const chartConfig = {
        backgroundGradientFrom: '#fff',
        backgroundGradientTo: '#fff',
        color: (opacity = 1) => `rgba(212, 163, 115, ${opacity})`, // Brand gold color
        labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`, // Dark gray inner text
        strokeWidth: 2, // optional, default 3
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: "#D4A373"
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>

            <View style={styles.header}>
                <Text style={styles.greeting}>Good Morning, {mother?.name?.split(' ')[0] || 'Mother'}! ☀️</Text>
                <Text style={styles.dayText}>Postpartum Day: {mother?.postpartumDay || 1}</Text>
                <Text style={styles.affirmationText}>"{getAffirmation()}"</Text>
            </View>

            {/* Risk Gauge Header Area */}
            <View style={[styles.riskCard, { borderTopColor: getRiskColorCode(currentRisk) }]}>
                <Text style={styles.riskTitle}>Current Safety Level</Text>
                <View style={styles.riskBadgeContainer}>
                    <View style={[styles.riskDot, { backgroundColor: getRiskColorCode(currentRisk) }]} />
                    <Text style={[styles.riskStatus, { color: getRiskColorCode(currentRisk) }]}>
                        {currentRisk.toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.riskDesc}>{getRiskMessage(currentRisk)}</Text>
            </View>

            {/* Quick Vitals Row */}
            <View style={styles.vitalsRow}>
                <View style={styles.vitalBox}>
                    <Text style={styles.vitalLabel}>Latest BP</Text>
                    <Text style={styles.vitalValue}>
                        {(latestLog?.systolicBP && latestLog?.diastolicBP) ? `${latestLog.systolicBP}/${latestLog.diastolicBP}` : '--/--'}
                    </Text>
                </View>
                <View style={styles.vitalBox}>
                    <Text style={styles.vitalLabel}>Sleep 💤</Text>
                    <Text style={styles.vitalValue}>
                        {latestLog?.sleepHours ? `${latestLog.sleepHours}h` : '--'}
                    </Text>
                </View>
                <View style={styles.vitalBox}>
                    <Text style={styles.vitalLabel}>Mood {getMoodEmoji(latestLog?.moodScore)}</Text>
                    <Text style={styles.vitalValue}>
                        {latestLog?.moodScore ? `${latestLog.moodScore}/10` : '--'}
                    </Text>
                </View>
            </View>

            {/* Comfort Intervention (Only shows if mood is 4 or below) */}
            {latestLog?.moodScore <= 4 && (
                <ComfortCard />
            )}

            {/* Mood Chart (Only show if mood is > 4 to keep screen clean when stressed) */}
            {latestLog?.moodScore > 4 && (
                <View style={styles.chartContainer}>
                    <Text style={styles.chartTitle}>Mood Trend (Past 7 Days)</Text>
                    <LineChart
                        data={moodChartData}
                        width={width - 40} // from react-native
                        height={220}
                        yAxisLabel=""
                        yAxisSuffix=" pts"
                        yAxisInterval={1}
                        chartConfig={chartConfig}
                        bezier
                        style={styles.chartStyle}
                        fromZero={true}
                        segments={5}
                    />
                </View>
            )}

            {/* BP Chart */}
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Blood Pressure Trend</Text>
                <LineChart
                    data={bpChartData}
                    width={width - 40}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chartStyle}
                    withShadow={false}
                />
            </View>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAF9F6' // Calm off-white
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40
    },
    centerAll: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    header: {
        marginTop: 40,
        marginBottom: 20
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333'
    },
    dayText: {
        fontSize: 16,
        color: '#666',
        marginTop: 5,
        fontWeight: '500'
    },
    affirmationText: {
        fontSize: 15,
        color: '#D4A373',
        marginTop: 12,
        fontStyle: 'italic',
        fontWeight: '500'
    },
    riskCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
        borderTopWidth: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
    },
    riskTitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 10
    },
    riskBadgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8
    },
    riskDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginRight: 8
    },
    riskStatus: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    riskDesc: {
        fontSize: 14,
        color: '#777',
        lineHeight: 20
    },
    vitalsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 25
    },
    vitalBox: {
        backgroundColor: '#fff',
        width: '30%',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    vitalLabel: {
        fontSize: 12,
        color: '#888',
        marginBottom: 5,
        fontWeight: '600'
    },
    vitalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333'
    },
    chartContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 20,
        marginBottom: 20,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#444',
        marginBottom: 15,
        alignSelf: 'flex-start',
        paddingHorizontal: 20
    },
    chartStyle: {
        marginVertical: 8,
        borderRadius: 16
    }
});

export default HomeScreen;
