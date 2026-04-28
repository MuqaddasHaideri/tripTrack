import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthTabSwitcher from '../../components/authSwitcher';
import { useDispatch } from 'react-redux';
import { loginUserApi } from '../../service/server';
import { continueAsGuest, setCredentials } from '../../redux/authSlice';

export default function LoginScreen() {
    const router = useRouter();
    const dispatch = useDispatch();

    const [showPassword, setShowPassword] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please fill in all fields.");
            return;
        }

        setLoading(true);

        try {
            const res = await loginUserApi(email, password);

            // Handle different API response formats safely
            const data = res?.data || res;

            if (data?.success) {
                const user = data?.data || data;

                const userObj = {
                    id: user?._id,
                    name: user?.name,
                    email: user?.email,
                    role: user?.role,
                    profilePic: user?.profilePic
                };

                dispatch(setCredentials({
                    user: userObj,
                    token: data?.jwt_token || data?.token
                }));

                Alert.alert("Success", `Welcome back, ${user?.name || 'User'}!`);
                if (user?.role === 'admin') {
                    //router.replace('/admin/dashboard');
                } else if (user?.role === 'driver') {
                    router.replace('/driver/Map');
                } else {
                    router.replace('/(tabs)');
                }
            } else {
                Alert.alert("Login Failed", data?.message || "Invalid credentials");
            }
        } catch (error) {
            const msg = error?.message || "Login failed. Please try again.";
            Alert.alert("Error", msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.welcomeText}>Welcome</Text>
                        <Text style={styles.subText}>Hi, you need to login to enter</Text>
                    </View>

                    <AuthTabSwitcher />

                    {/* Form */}
                    <View style={styles.form}>

                        {/* Email */}
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="mail-outline" size={20} color="#666" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="example@gmail.com"
                                value={email}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                onChangeText={setEmail}
                            />
                        </View>

                        {/* Password */}
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="key-outline" size={20} color="#666" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your password"
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons
                                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                                    size={20}
                                    color="#666"
                                />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.forgotBtn}>
                            <Text style={styles.forgotText}>Forgot Password?</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Login Button */}
                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <Text style={styles.primaryBtnText}>
                            {loading ? "Logging in..." : "Login"}
                        </Text>
                    </TouchableOpacity>

                    {/* Guest */}
                    <TouchableOpacity
                    style={styles.guestBtn}
                        onPress={() => {
                            dispatch(continueAsGuest());
                            router.replace('/(tabs)');
                        }}
                    >
                        <Text style={styles.guestBtnText}>Continue as Guest</Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// Styles
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5fdf9' },
    scrollContent: { paddingHorizontal: 25, paddingBottom: 50 },
    header: { alignItems: 'center', marginTop: 40 },
    welcomeText: { fontSize: 32, fontWeight: 'bold', color: '#1a1a1a' },
    subText: { color: '#666', marginTop: 5 },

    form: { marginBottom: 10 },

    label: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 5
    },

    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 15,
        paddingHorizontal: 15,
        height: 55,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#eee'
    },

    icon: { marginRight: 10 },

    input: {
        flex: 1,
        fontSize: 16,
        color: '#000'
    },

    forgotBtn: {
        alignSelf: 'flex-end',
        marginBottom: 20
    },

    forgotText: {
        color: '#196F31',
        fontWeight: '600'
    },

    primaryBtn: {
        backgroundColor: '#196F31',
        height: 55,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        marginTop: 10
    },

    primaryBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold'
    },

    guestBtn: {
        height: 55,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#196F31'
    },

    guestBtnText: {
        color: '#196F31',
        fontWeight: '600'
    }
});