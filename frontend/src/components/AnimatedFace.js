import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Path, Ellipse } from 'react-native-svg';

const AnimatedFace = ({ isSpeaking, emotion = 'neutral' }) => {
    const blinkAnim = useRef(new Animated.Value(1)).current;
    const mouthAnim = useRef(new Animated.Value(0.1)).current;
    const eyebrowAnim = useRef(new Animated.Value(0)).current;

    // Blinking logic
    useEffect(() => {
        let timeout;
        const blink = () => {
            Animated.sequence([
                Animated.timing(blinkAnim, { toValue: 0.1, duration: 100, useNativeDriver: true }),
                Animated.timing(blinkAnim, { toValue: 1, duration: 100, useNativeDriver: true })
            ]).start();
            timeout = setTimeout(blink, Math.random() * 4000 + 2000); // Blink every 2-6 sec
        };
        timeout = setTimeout(blink, 2000);
        return () => clearTimeout(timeout);
    }, []);

    // Lip sync logic
    useEffect(() => {
        if (isSpeaking) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(mouthAnim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
                    Animated.timing(mouthAnim, { toValue: 0.4, duration: 150, useNativeDriver: true }),
                    Animated.timing(mouthAnim, { toValue: 0.9, duration: 150, useNativeDriver: true }),
                    Animated.timing(mouthAnim, { toValue: 0.2, duration: 150, useNativeDriver: true })
                ])
            ).start();
        } else {
            mouthAnim.stopAnimation();
            Animated.timing(mouthAnim, { toValue: 0.1, duration: 200, useNativeDriver: true }).start();
        }
    }, [isSpeaking]);

    // Emotion logic (Eyebrows)
    useEffect(() => {
        let toValue = 0; // neutral
        if (emotion === 'happy') toValue = -3; // raised
        else if (emotion === 'concerned') toValue = 4; // furrowed / dropped

        Animated.timing(eyebrowAnim, {
            toValue,
            duration: 400,
            useNativeDriver: true
        }).start();
    }, [emotion]);

    return (
        <View style={styles.container}>
            <View style={styles.svgContainer}>

                {/* Base Face & Nose (Static) */}
                <Svg height="100%" width="100%" viewBox="0 0 140 140" style={StyleSheet.absoluteFill}>
                    <Circle cx="70" cy="70" r="48" fill="transparent" />
                    <Path d="M 70 68 Q 73 72 67 72" stroke="#D4A373" strokeWidth="2" fill="none" strokeLinecap="round" />
                </Svg>

                {/* Eyes (Blinking) */}
                <Animated.View style={[styles.part, { transform: [{ scaleY: blinkAnim }] }]}>
                    <Svg height="100%" width="100%" viewBox="0 0 140 140">
                        <Circle cx="55" cy="60" r="4.5" fill="#555" />
                        <Circle cx="85" cy="60" r="4.5" fill="#555" />
                    </Svg>
                </Animated.View>

                {/* Eyebrows (Emotive) */}
                <Animated.View style={[styles.part, { transform: [{ translateY: eyebrowAnim }] }]}>
                    <Svg height="100%" width="100%" viewBox="0 0 140 140">
                        <Path d="M 48 52 Q 55 48 62 52" stroke="#D4A373" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                        <Path d="M 78 52 Q 85 48 92 52" stroke="#D4A373" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    </Svg>
                </Animated.View>

                {/* Mouth (Lip Sync) */}
                <Animated.View style={[styles.part, { transform: [{ scaleY: mouthAnim }] }]}>
                    <Svg height="100%" width="100%" viewBox="0 0 140 140">
                        <Ellipse cx="70" cy="100" rx="8" ry="6" fill="#D4A373" />
                    </Svg>
                </Animated.View>

            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 350, // Much larger area
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    svgContainer: {
        width: '100%',
        height: '100%',
    },
    part: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    }
});

export default AnimatedFace;
