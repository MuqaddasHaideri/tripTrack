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
import { registerForPushNotifications } from '../../utils/notifications';
import { useTranslation } from 'react-i18next';
export default function LoginScreen() {
    
    const router = useRouter();
    const dispatch = useDispatch();
    const [showPassword, setShowPassword] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
      const { t } = useTranslation();
    const handleLogin = async () => {
        const trimmedEmail = email.trim();

        if (!trimmedEmail || !password) {
            Alert.alert(t("login.error"), t("login.fillAllFields"));
            return;
        }

        setLoading(true);

        try {
            const res = await loginUserApi(trimmedEmail, password);

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

                const authToken = data?.jwt_token || data?.token;

                dispatch(setCredentials({
                    user: userObj,
                    token: authToken
                }));

                console.log('Requesting push notification permission...');
                registerForPushNotifications(authToken).then((token) => {
                    console.log('Push registration result:', token || 'failed/denied');
                }).catch((err) => {
                    console.log('Push registration error:', err);
                });

                Alert.alert(t("login.success"), t(`login.welcomeBack`, { name: user?.name || 'User' }));
                if (user?.role === 'admin') {
                    //router.replace('/admin/dashboard');
                } else if (user?.role === 'driver') {
                    router.replace('/driver/Map');
                } else {
                    router.replace('/(tabs)');
                }
            } else {
                const msg = data?.message || t("login.invalidCredentials");
                if (msg.includes("pending admin approval")) {
                    router.push({ pathname: '/driver/PendingApproval', params: { email: trimmedEmail } });
                } else {
                    Alert.alert(t("login.loginFailed"), msg);
                }
            }
        } catch (error) {
            const msg = typeof error === 'string' ? error : ((error as any)?.message || t("login.loginFailed"));
            if (msg.toLowerCase().includes("pending") || msg.toLowerCase().includes("approval")) {
                router.push({ pathname: '/driver/PendingApproval', params: { email: trimmedEmail } });
            } else {
                Alert.alert(t("login.error"), msg);
            }
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
                        <Text style={styles.welcomeText}>{t("login.welcome")}</Text>
                        <Text style={styles.subText}>{t("login.subtitle")}</Text>
                    </View>

                    <AuthTabSwitcher />

                    {/* Form */}
                    <View style={styles.form}>

                        {/* Email */}
                        <Text style={styles.label}>{t("login.emailAddress")}</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="mail-outline" size={20} color="#666" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder={t("login.emailPlaceholder")}
                                value={email}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                onChangeText={setEmail}
                            />
                        </View>

                        {/* Password */}
                        <Text style={styles.label}>{t("login.password")}</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="key-outline" size={20} color="#666" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder={t("login.passwordPlaceholder")}
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

                        {/* <TouchableOpacity style={styles.forgotBtn}>
                            <Text style={styles.forgotText}>{t("login.forgotPassword")}</Text>
                        </TouchableOpacity> */}
                    </View>

                    {/* Login Button */}
                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <Text style={styles.primaryBtnText}>
                            {loading ? t("login.loggingIn") : t("login.login")}
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
                        <Text style={styles.guestBtnText}>{t("login.continueAsGuest")}</Text>
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