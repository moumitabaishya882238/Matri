import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Path, Ellipse, G } from 'react-native-svg';

const AnimatedG = Animated.createAnimatedComponent(G);

const AnimatedFace = ({ isSpeaking, emotion = 'neutral' }) => {
    const blinkAnim = useRef(new Animated.Value(1)).current; // 1 = open, 0 = closed
    const mouthAnim = useRef(new Animated.Value(0.1)).current;
    const eyebrowAnim = useRef(new Animated.Value(0)).current;

    // Blinking logic (top → down)
    useEffect(() => {
        let timeout;
        const blink = () => {
            Animated.sequence([
                Animated.timing(blinkAnim, { toValue: 0, duration: 100, useNativeDriver: false }),
                Animated.timing(blinkAnim, { toValue: 1, duration: 100, useNativeDriver: false })
            ]).start();
            timeout = setTimeout(blink, Math.random() * 4000 + 2000); // 2–6 sec
        };
        timeout = setTimeout(blink, 2000);
        return () => clearTimeout(timeout);
    }, [blinkAnim]);

    // Lip sync logic
    useEffect(() => {
        if (isSpeaking) {
            const loop = Animated.loop(
                Animated.sequence([
                    Animated.timing(mouthAnim, { toValue: 1.2, duration: 150, useNativeDriver: false }),
                    Animated.timing(mouthAnim, { toValue: 0.4, duration: 150, useNativeDriver: false }),
                    Animated.timing(mouthAnim, { toValue: 0.9, duration: 150, useNativeDriver: false }),
                    Animated.timing(mouthAnim, { toValue: 0.2, duration: 150, useNativeDriver: false })
                ])
            );
            loop.start();

            return () => {
                loop.stop();
            };
        } else {
            mouthAnim.stopAnimation();
            Animated.timing(mouthAnim, { toValue: 0.1, duration: 200, useNativeDriver: false }).start();
        }
    }, [isSpeaking, mouthAnim]);

    // Emotion logic (Eyebrows)
    useEffect(() => {
        let toValue = 0; // neutral
        if (emotion === 'happy') toValue = -3; // raised
        else if (emotion === 'concerned') toValue = 4; // dropped

        Animated.timing(eyebrowAnim, {
            toValue,
            duration: 400,
            useNativeDriver: false
        }).start();
    }, [emotion, eyebrowAnim]);

    // Map blinkAnim (0–1) to a visible height 0–8 for lids
    const leftEyeScale = blinkAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 8]
    });
    const rightEyeScale = blinkAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 8]
    });

    return (
        <View style={styles.container}>
            <View style={styles.svgContainer}>
                <Svg height="100%" width="100%" viewBox="0 0 150 150" preserveAspectRatio="xMidYMid meet">

                    {/* Head Boundary (Optional / Transparent for now) */}
                    <Circle cx="75" cy="75" r="45" fill="transparent" />

                    {/* Eyes (Blinking) - directly under eyebrows, closing downwards */}
                    {/* Left eye center around (55, 55) */}
                    <G>
                        <AnimatedG>
                            <Circle cx="55" cy="55" r="8" fill="#475569" />
                        </AnimatedG>

                        {/* Mask the eye by drawing a rect-like lid using scale from top to bottom */}
                        <AnimatedG origin="55,51" scaleY={blinkAnim}>
                            <Circle cx="55" cy="51" r="8" fill="#F8FAFC" />
                        </AnimatedG>

                        {/* Right eye center around (95, 55) */}
                        <AnimatedG>
                            <Circle cx="95" cy="55" r="8" fill="#475569" />
                        </AnimatedG>

                        <AnimatedG origin="95,51" scaleY={blinkAnim}>
                            <Circle cx="95" cy="51" r="8" fill="#F8FAFC" />
                        </AnimatedG>
                    </G>

                    {/* Eyebrows (Emotive) */}
                    <AnimatedG y={eyebrowAnim}>
                        <Path
                            d="M 45 35 Q 55 28 65 35"
                            stroke="#D4A373"
                            strokeWidth="5"
                            fill="none"
                            strokeLinecap="round"
                        />
                        <Path
                            d="M 85 35 Q 95 28 105 35"
                            stroke="#D4A373"
                            strokeWidth="5"
                            fill="none"
                            strokeLinecap="round"
                        />
                    </AnimatedG>

                    {/* Nose (Static) */}
                    <Path
                        d="M 75 75 Q 82 85 68 85"
                        stroke="#D4A373"
                        strokeWidth="4"
                        fill="none"
                        strokeLinecap="round"
                    />

                    {/* Mouth (Lip Sync) */}
                    <G transform="translate(75, 105)">
                        <AnimatedG scaleY={mouthAnim}>
                            <Ellipse cx="0" cy="0" rx="20" ry="10" fill="#D4A373" />
                        </AnimatedG>
                    </G>
                </Svg>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent'
    },
    svgContainer: {
        width: '100%',
        height: '100%'
    }
});

export default AnimatedFace;
