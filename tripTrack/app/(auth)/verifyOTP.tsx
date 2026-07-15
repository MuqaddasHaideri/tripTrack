import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity,
    StatusBar, KeyboardAvoidingView, Platform, Alert, ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { verifyEmailApi } from '@/service/server'; 

export default function OtpScreen() {
    const router = useRouter();
    const { email, role } = useLocalSearchParams<{ email: string; role?: string }>(); 

    const [otp, setOtp] = useState(['', '', '', '', '', '']); // 6 digit OTP
    const [isVerifying, setIsVerifying] = useState(false);
    const [timer, setTimer] = useState(60);
    const [activeInputIndex, setActiveInputIndex] = useState(0); // Track focused input

    // FIXED: Correctly initialize refs array structure
    const inputRefs = useRef<Array<TextInput | null>>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleChange = (text: string, index: number) => {
        // Only allow numbers
        const numericValue = text.replace(/[^0-9]/g, '');

        const newOtp = [...otp];
        newOtp[index] = numericValue;
        setOtp(newOtp);

        // FIXED: Safe ref check before calling focus to prevent crash on slow devices
        if (numericValue && index < 5) {
            const nextInput = inputRefs.current[index + 1];
            if (nextInput) {
                nextInput.focus();
            }
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        // FIXED: Safe ref selection on backspace
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            const previousInput = inputRefs.current[index - 1];
            if (previousInput) {
                previousInput.focus();
            }
        }
    };

    const handleVerify = async () => {
        const otpCode = otp.join('');
        if (otpCode.length < 6) {
            Alert.alert("Invalid Code", "Please enter the full 6-digit code.");
            return;
        }

        try {
            setIsVerifying(true);
            const data = await verifyEmailApi(email, otpCode);

            if (data.success) {
                Alert.alert("Verified!", "Your account is now active.", [
                    { text: "Go to Login", onPress: () => router.replace('/(auth)/login') }
                ]);
            } else {
                Alert.alert("Verification Failed", data.message || "Wrong OTP.");
            }
        } catch (error) {
            Alert.alert("Error", "Server connection failed.");
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={styles.content}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#196F31" />
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <Text style={styles.title}>Verify Email</Text>
                        <Text style={styles.subText}>We've sent a code to {email}</Text>
                    </View>

                    <View style={styles.otpContainer}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => {
                                    inputRefs.current[index] = ref;
                                }}
                                style={[
                                    styles.otpInput,
                                    // Highlight active focused box or boxes containing entered code
                                    (activeInputIndex === index || digit !== '') && styles.otpInputActive
                                ]}
                                keyboardType="number-pad"
                                maxLength={1}
                                onFocus={() => setActiveInputIndex(index)}
                                onChangeText={(text) => handleChange(text, index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                value={digit}
                                selectTextOnFocus
                            />
                        ))}
                    </View>

                    <Text style={styles.timerText}>
                        {timer > 0 ? `Resend code in ${timer}s` : "Didn't receive code?"}
                    </Text>

                    {timer === 0 && (
                        <TouchableOpacity onPress={() => setTimer(60)}>
                            <Text style={styles.resendText}>Resend OTP</Text>
                        </TouchableOpacity>
                    )}

                    {/* FIXED: Dynamic state colors applied */}
                    <TouchableOpacity 
                        style={[
                            styles.primaryBtn, 
                            isVerifying ? styles.btnLoadingBg : styles.btnActiveBg
                        ]} 
                        onPress={handleVerify}
                        disabled={isVerifying}
                    >
                        {isVerifying ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.primaryBtnText}>Verify Now</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5fdf9' },
    content: { paddingHorizontal: 25, flex: 1 },
    backBtn: { marginTop: 20 },
    header: { marginTop: 40, marginBottom: 40 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a' },
    subText: { color: '#666', marginTop: 8, fontSize: 15 },
    otpContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    otpInput: {
        width: 45,
        height: 55,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#eee',
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#196F31'
    },
    // Lit active input styles
    otpInputActive: {
        borderColor: '#196F31',
        backgroundColor: '#fbfefc'
    },
    timerText: { textAlign: 'center', color: '#666', marginBottom: 10 },
    resendText: { textAlign: 'center', color: '#196F31', fontWeight: 'bold', marginBottom: 30 },
    primaryBtn: {
        height: 55,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnActiveBg: {
        backgroundColor: '#196F31',
    },
    btnLoadingBg: {
        backgroundColor: '#A0B4A5',
    },
    primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});