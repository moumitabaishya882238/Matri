import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import Tts from 'react-native-tts';
import Sound from 'react-native-sound';

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
        Tts.speak(currentSec.toString(), { androidParams: { KEY_PARAM_VOLUME: 1, KEY_PARAM_STREAM: 'STREAM_MUSIC' } });

        if (intervalRef.current) clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            currentSec -= 1;
            if (currentSec > 0) {
                setBreatheText(currentSec.toString());
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
        Tts.stop();
        if (backgroundMusic) backgroundMusic.play();
        Tts.speak('Let us take a moment to rest. Please, close your eyes... Drop your shoulders... Unclench your jaw... and listen to the sound of your own breath. You are safe. You are a wonderful mother. Everything is going to be okay.', {
            androidParams: { KEY_PARAM_VOLUME: 1, KEY_PARAM_STREAM: 'STREAM_MUSIC' },
        });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>You seem a little stressed today.</Text>
            <Text style={styles.subtitle}>Take a moment for yourself. You deserve it. 🌸</Text>

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
                                styles.breatheCircle,
                                { transform: [{ scale: breatheAnim }] }
                            ]} />
                            <Text style={styles.breatheTextOver}>{breatheText}</Text>
                            <Text style={styles.breatheSubText}>{breatheSubText}</Text>
                        </View>
                    )}

                    {activeAction === 'mindfulness' && (
                        <View style={styles.mindfulnessContainer}>
                            <Text style={styles.mindfulnessIcon}>😌</Text>
                            <Text style={styles.mindfulnessText}>Listen to MATRI's voice...</Text>
                        </View>
                    )}

                    <TouchableOpacity style={styles.closeButton} onPress={stopAction}>
                        <Text style={styles.closeText}>Stop</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFEBE6', // Very soft warm pink/orange
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#D4A373',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
        color: '#777',
        marginBottom: 20,
        textAlign: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    actionButton: {
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
    },
    activeArea: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 20,
    },
    breatheContainer: {
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    breatheCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#A8D5BA', // Soft calm green
        position: 'absolute',
        opacity: 0.6,
    },
    breatheTextOver: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        zIndex: 10,
    },
    breatheSubText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        zIndex: 10,
        marginTop: 5,
    },
    mindfulnessContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    mindfulnessIcon: {
        fontSize: 50,
        marginBottom: 10,
    },
    mindfulnessText: {
        fontSize: 16,
        color: '#555',
        fontStyle: 'italic',
    },
    closeButton: {
        marginTop: 10,
        paddingVertical: 8,
        paddingHorizontal: 20,
        backgroundColor: '#ccc',
        borderRadius: 15,
    },
    closeText: {
        color: '#fff',
        fontWeight: 'bold',
    }
});

export default ComfortCard;
