import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import Tts from 'react-native-tts';
import Sound from 'react-native-sound';
import LinearGradient from 'react-native-linear-gradient';

// Enable playback in silence mode
Sound.setCategory('Playback');

const SOOTHING_AUDIO_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'; // Placeholder for a gentle track
let backgroundMusic = null;

const ComfortCard = () => {
    const [activeAction, setActiveAction] = useState(null); // 'breathing', 'mindfulness', 'audio'

    // Animation Values for 4-7-8 Breathing
    const breatheAnim = useRef(new Animated.Value(1)).current;
    const [breatheText, setBreatheText] = useState('');
    const [breatheSubText, setBreatheSubText] = useState('Inhale');
    const timeouts = useRef([]);
    const intervalRef = useRef(null);

    // Clean up TTS, audio, and animations on unmount
    useEffect(() => {
        // Pre-load the background music
        backgroundMusic = new Sound(SOOTHING_AUDIO_URL, null, (error) => {
            if (error) {
                console.log('failed to load the sound', error);
                return;
            }
            backgroundMusic.setNumberOfLoops(-1); // Loop indefinitely
            backgroundMusic.setVolume(0.15); // Keep it very soft so voice is heard
        });

        return () => {
            Tts.stop();
            breatheAnim.stopAnimation();
            timeouts.current.forEach(clearTimeout);
            if (intervalRef.current) clearInterval(intervalRef.current);

            if (backgroundMusic) {
                backgroundMusic.stop();
                backgroundMusic.release();
            }
        };
    }, []);

    const startBreathing = () => {
        setActiveAction('breathing');
        breatheAnim.setValue(1);
        if (backgroundMusic) backgroundMusic.play();
        loopBreathing();
    };

    const runPhase = (phaseName, durationSecs, nextCallback) => {
        let currentSec = durationSecs;
        setBreatheSubText(phaseName);
        setBreatheText(currentSec.toString());
        Tts.stop();
        Tts.speak(currentSec.toString(), { androidParams: { KEY_PARAM_VOLUME: 1, KEY_PARAM_STREAM: 'STREAM_MUSIC' } });

        if (intervalRef.current) clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            currentSec -= 1;
            if (currentSec > 0) {
                setBreatheText(currentSec.toString());
                Tts.stop();
                Tts.speak(currentSec.toString(), { androidParams: { KEY_PARAM_VOLUME: 1, KEY_PARAM_STREAM: 'STREAM_MUSIC' } });
            } else {
                clearInterval(intervalRef.current);
            }
        }, 1000);

        const phaseTimeout = setTimeout(() => {
            if (nextCallback) nextCallback();
        }, durationSecs * 1000);

        timeouts.current.push(phaseTimeout);
    };

    const loopBreathing = () => {
        // Clear previous timeouts and intervals just in case
        timeouts.current.forEach(clearTimeout);
        if (intervalRef.current) clearInterval(intervalRef.current);
        timeouts.current = [];

        // Chain the phases with countdowns
        runPhase('Inhale', 4, () => {
            runPhase('Hold', 7, () => {
                runPhase('Exhale', 8, () => {
                    // The Animated.sequence loop handles the animation timing, but we need
                    // the voice timing to loop perfectly with it.
                    // By the time 'Exhale' finishes (19s total), the animation `finished` callback fires.
                });
            });
        });

        Animated.sequence([
            // 1. Inhale (4 seconds) - Grow
            Animated.timing(breatheAnim, {
                toValue: 2.5, // 2.5x size
                duration: 4000,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            }),
            // 2. Hold (7 seconds) - Keep size
            Animated.delay(7000),
            // 3. Exhale (8 seconds) - Shrink back
            Animated.timing(breatheAnim, {
                toValue: 1, // Back to normal size
                duration: 8000,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            })
        ]).start(({ finished }) => {
            if (finished) {
                loopBreathing(); // Loop until user stops or unmounts
            }
        });
    };

    const stopAction = () => {
        setActiveAction(null);
        breatheAnim.stopAnimation();
        timeouts.current.forEach(clearTimeout);
        if (intervalRef.current) clearInterval(intervalRef.current);
        Tts.stop();
        if (backgroundMusic) backgroundMusic.pause();
    };

    const startMindfulness = () => {
        setActiveAction('mindfulness');
        breatheAnim.setValue(1);
        Tts.stop();
        if (backgroundMusic) backgroundMusic.play();

        // Endless subtle pulsing aura
        Animated.loop(
            Animated.sequence([
                Animated.timing(breatheAnim, {
                    toValue: 1.2,
                    duration: 4000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true
                }),
                Animated.timing(breatheAnim, {
                    toValue: 1,
                    duration: 4000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true
                })
            ])
        ).start();

        Tts.speak('Let us take a moment to rest. Please, close your eyes... Drop your shoulders... Unclench your jaw... and listen to the sound of your own breath. You are safe. You are a wonderful mother. Everything is going to be okay.', {
            androidParams: { KEY_PARAM_VOLUME: 1, KEY_PARAM_STREAM: 'STREAM_MUSIC' },
        });
    };

    const getRingColor = () => {
        if (breatheSubText === 'Hold') return '#CDB4DB'; // Soft Purple
        if (breatheSubText === 'Exhale') return '#F4A261'; // Warm Peach
        return '#A8D5BA'; // Calm Green for Inhale/Default
    };

    return (
        <LinearGradient colors={['#FFFcfc', '#FFF0ED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
            <Text style={styles.title}>You seem a little stressed today.</Text>
            <Text style={styles.subtitle}>Take a moment for yourself. You deserve it. </Text>

            {!activeAction ? (
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={startBreathing}>
                        <Text style={styles.buttonText}>🫧 4-7-8 Breathing</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={startMindfulness}>
                        <Text style={styles.buttonText}>🧘‍♀️ Guided Rest</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.activeArea}>
                    {activeAction === 'breathing' && (
                        <View style={styles.breatheContainer}>
                            <Animated.View style={[
                                styles.breatheCircleLayer3,
                                { transform: [{ scale: breatheAnim }], backgroundColor: getRingColor() }
                            ]} />
                            <Animated.View style={[
                                styles.breatheCircleLayer2,
                                { transform: [{ scale: breatheAnim }], backgroundColor: getRingColor() }
                            ]} />
                            <Animated.View style={[
                                styles.breatheCircleLayer1,
                                { transform: [{ scale: breatheAnim }], backgroundColor: getRingColor() }
                            ]} />
                            <Text style={styles.breatheTextOver}>{breatheText}</Text>
                            <Text style={styles.breatheSubText}>{breatheSubText}</Text>
                        </View>
                    )}

                    {activeAction === 'mindfulness' && (
                        <View style={styles.mindfulnessContainer}>
                            <Animated.View style={[styles.auraCircle, { transform: [{ scale: breatheAnim }] }]} />
                            <Text style={styles.mindfulnessIcon}>✨</Text>
                            <Text style={styles.mindfulnessText}>Gently close your eyes...</Text>
                            <Text style={styles.mindfulnessSubText}>Listen closely to MATRI's voice</Text>
                        </View>
                    )}

                    <TouchableOpacity style={styles.closeButton} onPress={stopAction}>
                        <Text style={styles.closeText}>End Session</Text>
                    </TouchableOpacity>
                </View>
            )}
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        alignItems: 'center',
        shadowColor: "#E29578", // Warm gentle shadow
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 25,
        elevation: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.9)',
        overflow: 'hidden'
    },
    title: {
        fontSize: 19,
        fontWeight: '800',
        color: '#D4A373',
        marginBottom: 6,
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: 14,
        color: '#8D99AE',
        marginBottom: 24,
        textAlign: 'center',
        fontWeight: '500',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    actionButton: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 24,
        shadowColor: "#D4A373",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#FEFAE0',
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#606C38',
    },
    activeArea: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 20,
    },
    breatheContainer: {
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    breatheCircleLayer1: {
        width: 60,
        height: 60,
        borderRadius: 30,
        position: 'absolute',
        opacity: 0.8,
    },
    breatheCircleLayer2: {
        width: 80,
        height: 80,
        borderRadius: 40,
        position: 'absolute',
        opacity: 0.3,
    },
    breatheCircleLayer3: {
        width: 100,
        height: 100,
        borderRadius: 50,
        position: 'absolute',
        opacity: 0.1,
    },
    breatheTextOver: {
        fontSize: 42,
        fontWeight: '300',
        color: '#FFFFFF',
        zIndex: 10,
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
    },
    breatheSubText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
        zIndex: 10,
        marginTop: 6,
        letterSpacing: 3,
        textTransform: 'uppercase',
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    mindfulnessContainer: {
        alignItems: 'center',
        marginBottom: 24,
        justifyContent: 'center'
    },
    auraCircle: {
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: '#FFD6BA',
        position: 'absolute',
        opacity: 0.3,
    },
    mindfulnessIcon: {
        fontSize: 48,
        marginBottom: 8,
        zIndex: 5
    },
    mindfulnessText: {
        fontSize: 18,
        color: '#D4A373',
        fontWeight: '700',
        zIndex: 5
    },
    mindfulnessSubText: {
        fontSize: 14,
        color: '#8D99AE',
        fontStyle: 'italic',
        marginTop: 4,
        zIndex: 5
    },
    closeButton: {
        marginTop: 10,
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.04)'
    },
    closeText: {
        color: '#8D99AE',
        fontWeight: '600',
        fontSize: 14
    }
});

export default React.memo(ComfortCard);
