import React, { useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Rect, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import client from '../../api/client';
import ComfortCard from '../../components/ComfortCard';
import { AuthContext } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

// Premium Medical Color Palette
const COLORS = {
    primary: '#0077CE',      // Trustworthy Clinical Blue
    secondary: '#E8F4F8',    // Very soft blue/teal background
    accent: '#48BCA2',       // Calming Health Green
    warning: '#FF8A65',      // Soft warning orange
    danger: '#EF5350',       // Accessible red
    textDark: '#1E293B',     // Slate very dark
    textMuted: '#64748B',    // Slate medical gray
    background: '#F8FAFC',   // Tranquil off-white
    white: '#FFFFFF',
    border: '#E2E8F0',
};

const HomeScreen = ({ navigation }) => {
    const { logout } = useContext(AuthContext);
    const [isLoading, setIsLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const insets = useSafeAreaInsets();

    useFocusEffect(
        useCallback(() => {
            let isActive = true;
            const fetchDashboard = async () => {
                try {
                    setIsLoading(true);
                    const response = await client.get('/mother/dashboard');
                    if (isActive) setDashboardData(response.data);
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
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading clinical dashboard...</Text>
            </View>
        );
    }

    if (!dashboardData) {
        return (
            <View style={[styles.container, styles.centerAll]}>
                <Text style={styles.errorText}>Unable to load patient data. Please pull to refresh.</Text>
            </View>
        );
    }

    const { mother, currentRisk, latestLog, historicalLogs } = dashboardData;

    const getRiskConfig = (risk) => {
        if (risk === 'Green') return { color: COLORS.accent, title: 'Optimal', icon: '🟢', message: 'All vitals are stable. You are doing wonderfully today.' };
        if (risk === 'Orange') return { color: COLORS.warning, title: 'Elevated Risk', icon: '🟠', message: 'Slight irregularities detected. We kindly suggest monitoring your vitals.' };
        if (risk === 'Red') return { color: COLORS.danger, title: 'Critical Attention', icon: '🔴', message: 'Immediate medical consultation advised based on your recent logs.' };
        return { color: COLORS.accent, title: 'Stable', icon: '🩺', message: 'No recent anomalies detected.' };
    };

    const riskConfig = getRiskConfig(currentRisk);

    const getMoodDesc = (score) => {
        if (!score) return { label: 'No Data', icon: '—' };
        if (score >= 8) return { label: 'Excellent', icon: '😌' };
        if (score >= 6) return { label: 'Stable', icon: '🙂' };
        if (score >= 4) return { label: 'Fatigued', icon: '🥱' };
        return { label: 'Struggling', icon: '😔' };
    };

    const moodInfo = getMoodDesc(latestLog?.moodScore);

    const getAffirmation = () => {
        const affirmations = [
            "You are doing an incredible job. Rest is a medical necessity, not a luxury.",
            "Your body performed a miracle. Give it time to heal.",
            "It is completely normal to ask for clinical or emotional support.",
            "Every day is a step forward in your postpartum recovery."
        ];
        return affirmations[new Date().getDate() % affirmations.length];
    };

    const daysWithData = historicalLogs.filter(log => log.moodScore || log.systolicBP);
    let labels = ['Today'], moodScores = [0], systolic = [0], diastolic = [0];

    if (daysWithData.length > 0) {
        const recentSubset = daysWithData.slice(-7);
        labels = recentSubset.map(log => {
            const date = new Date(log.date);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        });
        moodScores = recentSubset.map(log => log.moodScore || 0);
        systolic = recentSubset.map(log => log.systolicBP || 0);
        diastolic = recentSubset.map(log => log.diastolicBP || 0);
    }

    const chartConfigBase = {
        backgroundGradientFrom: COLORS.white,
        backgroundGradientTo: COLORS.white,
        color: (opacity = 1) => `rgba(0, 119, 206, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        propsForBackgroundLines: {
            strokeDasharray: "4 4",
            stroke: COLORS.border,
            strokeWidth: 1,
        },
        fillShadowGradientFrom: COLORS.primary,
        fillShadowGradientFromOpacity: 0.2,
        fillShadowGradientTo: COLORS.white,
        fillShadowGradientToOpacity: 0,
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            {/* Soft Premium Medical SVG Gradient Header Backdrop */}
            <View style={StyleSheet.absoluteFill}>
                <Svg height="350" width="100%">
                    <Defs>
                        <SvgLinearGradient id="headerGrad" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={COLORS.secondary} stopOpacity="1" />
                            <Stop offset="0.6" stopColor={COLORS.secondary} stopOpacity="0.8" />
                            <Stop offset="1" stopColor={COLORS.background} stopOpacity="0" />
                        </SvgLinearGradient>
                    </Defs>
                    <Rect x="0" y="0" width="100%" height="350" fill="url(#headerGrad)" />
                </Svg>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.headerTopRow}>
                        <View>
                            <Text style={styles.welcomeSubtitle}>Postpartum Day {mother?.postpartumDay || 1}</Text>
                            <Text style={styles.greeting}>Good Morning, {mother?.name?.split(' ')[0] || 'Mother'} 👋</Text>
                        </View>
                    </View>

                    <View style={styles.affirmationBox}>
                        <Text style={styles.affirmationText}>"{getAffirmation()}"</Text>
                    </View>
                </View>

                {/* Primary Clinical Status Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Clinical Status</Text>
                        <View style={[styles.statusBadge, { backgroundColor: riskConfig.color + '15' }]}>
                            <Text style={[styles.statusBadgeText, { color: riskConfig.color }]}>
                                {riskConfig.icon} {riskConfig.title}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.riskMessage}>{riskConfig.message}</Text>
                </View>

                {/* Patient Vitals Overview */}
                <Text style={styles.sectionHeader}>Latest Snapshot</Text>
                <View style={styles.vitalsRow}>
                    <View style={styles.vitalBox}>
                        <View style={[styles.vitalIconBg, { backgroundColor: '#E0F2FE' }]}>
                            <Text style={styles.vitalEmoji}>🩸</Text>
                        </View>
                        <Text style={styles.vitalValue}>
                            {(latestLog?.systolicBP && latestLog?.diastolicBP) ? `${latestLog.systolicBP}/${latestLog.diastolicBP}` : '--/--'}
                        </Text>
                        <Text style={styles.vitalLabel}>Blood Pressure</Text>
                    </View>

                    <View style={styles.vitalBox}>
                        <View style={[styles.vitalIconBg, { backgroundColor: '#F3E8FF' }]}>
                            <Text style={styles.vitalEmoji}>💤</Text>
                        </View>
                        <Text style={styles.vitalValue}>
                            {latestLog?.sleepHours ? `${latestLog.sleepHours}h` : '--'}
                        </Text>
                        <Text style={styles.vitalLabel}>Sleep Duration</Text>
                    </View>

                    <View style={styles.vitalBox}>
                        <View style={[styles.vitalIconBg, { backgroundColor: '#FFEDD5' }]}>
                            <Text style={styles.vitalEmoji}>{moodInfo.icon}</Text>
                        </View>
                        <Text style={styles.vitalValue}>
                            {latestLog?.moodScore ? `${latestLog.moodScore}/10` : '--'}
                        </Text>
                        <Text style={styles.vitalLabel}>{moodInfo.label}</Text>
                    </View>
                </View>

                {/* Comfort Intervention (If mood is fatigued/struggling) */}
                {latestLog?.moodScore <= 4 && (
                    <View style={styles.interventionWrapper}>
                        <ComfortCard />
                    </View>
                )}

                {/* Medical Charts */}
                {latestLog?.moodScore > 4 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Emotional Wellbeing History</Text>
                        <LineChart
                            data={{
                                labels,
                                datasets: [{ data: moodScores }]
                            }}
                            width={width - 80} // Width minus padding
                            height={200}
                            yAxisLabel=""
                            chartConfig={{
                                ...chartConfigBase,
                                color: (opacity = 1) => `rgba(168, 85, 247, ${opacity})`, // Soft purple
                                fillShadowGradientFrom: '#A855F7',
                            }}
                            bezier
                            style={styles.chartStyle}
                            fromZero={true}
                        />
                    </View>
                )}

                <View style={[styles.card, { marginBottom: 60 }]}>
                    <Text style={styles.cardTitle}>Blood Pressure Trend</Text>
                    <LineChart
                        data={{
                            labels: labels,
                            legend: ['Systolic', 'Diastolic'],
                            datasets: [
                                { data: systolic, color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})` },
                                { data: diastolic, color: (opacity = 1) => `rgba(14, 165, 233, ${opacity})` }
                            ]
                        }}
                        width={width - 80}
                        height={200}
                        chartConfig={chartConfigBase}
                        bezier
                        style={styles.chartStyle}
                    />
                </View>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    centerAll: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingText: {
        marginTop: 15,
        color: COLORS.textMuted,
        fontSize: 16,
        fontWeight: '500'
    },
    errorText: {
        color: COLORS.danger,
        fontSize: 16,
    },
    header: {
        marginBottom: 25,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    welcomeSubtitle: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    greeting: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.textDark,
        letterSpacing: -0.5,
    },
    logoutBtn: {
        backgroundColor: COLORS.white,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: COLORS.textDark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    logoutText: {
        color: COLORS.textMuted,
        fontWeight: '600',
        fontSize: 13,
    },
    affirmationBox: {
        marginTop: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        padding: 15,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
    },
    affirmationText: {
        fontSize: 15,
        color: COLORS.textMuted,
        fontStyle: 'italic',
        lineHeight: 22,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(226, 232, 240, 0.5)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.textDark,
        letterSpacing: -0.3,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusBadgeText: {
        fontWeight: '700',
        fontSize: 13,
    },
    riskMessage: {
        fontSize: 15,
        color: COLORS.textMuted,
        lineHeight: 22,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textDark,
        marginBottom: 15,
        marginTop: 5,
        marginLeft: 4,
    },
    vitalsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 25,
    },
    vitalBox: {
        backgroundColor: COLORS.white,
        width: '31%',
        paddingVertical: 18,
        paddingHorizontal: 10,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(226, 232, 240, 0.4)',
    },
    vitalIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    vitalEmoji: {
        fontSize: 20,
    },
    vitalValue: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.textDark,
        marginBottom: 4,
    },
    vitalLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontWeight: '600',
        textAlign: 'center',
    },
    interventionWrapper: {
        marginBottom: 20,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 5,
    },
    chartStyle: {
        marginTop: 15,
        borderRadius: 16,
        alignSelf: 'center',
    }
});

export default HomeScreen;
