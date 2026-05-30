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
    const { email, role } = useLocalSearchParams(); // Get data from previous screen

    const [otp, setOtp] = useState(['', '', '', '', '', '']); // 6 digit OTP
    const [isVerifying, setIsVerifying] = useState(false);
    const [timer, setTimer] = useState(60);
    const inputRefs = useRef([]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleChange = (text, index) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        // Move to next input automatically
        if (text && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
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
            // Replace with your actual backend call
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
                                ref={(ref) => (inputRefs.current[index] = ref)}
                                style={styles.otpInput}
                                keyboardType="number-pad"
                                maxLength={1}
                                onChangeText={(text) => handleChange(text, index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                value={digit}
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

                    <TouchableOpacity 
                        style={styles.primaryBtn} 
                        onPress={handleVerify}
                        disabled={isVerifying}
                    >
                        {isVerifying ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Verify Now</Text>}
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
    timerText: { textAlign: 'center', color: '#666', marginBottom: 10 },
    resendText: { textAlign: 'center', color: '#196F31', fontWeight: 'bold', marginBottom: 30 },
    primaryBtn: {
        backgroundColor: '#196F31',
        height: 55,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});