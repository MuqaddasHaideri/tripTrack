import React, { useState } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity,
    StatusBar, KeyboardAvoidingView, Platform, ScrollView, Alert,
    Image, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AuthTabSwitcher from '../../components/authSwitcher';
import { signupdriver, signupUserApi } from '@/service/server';
import {
    pickImage,
    uploadToCloudinary,
} from '@/utils/pickImage';
import { useTranslation } from 'react-i18next';
export default function SignupScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const [role, setRole] = useState('passenger');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [cnic, setCnic] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [imageUri, setImageUri] = useState(null);
    const handleSignup = async () => {
        if (!name || !email || !password || !phone) {
            Alert.alert(t("signup.missingInput"), t("signup.fillAllFields"));
            return;
        }
        if (role === 'driver') {
            // Driver Validation
            if (!cnic) {
                Alert.alert(t("signup.missingInput"), t("signup.cnicRequired"));
                return;
            }
            if (!imageUri) {
                Alert.alert(t("signup.licenseRequiredTitle"), t("signup.licenseRequiredMessage"));
                return;
            }
            try {
                setIsUploading(true);
                const uploadedLicenseUrl = await uploadToCloudinary(imageUri);
                const data = await signupdriver(
                    name,
                    email,
                    password,
                    'driver',
                    phone,
                    cnic,
                    uploadedLicenseUrl
                );
                if (data.success) {
                    router.replace('/driver/PendingApproval');
                } else {
                    Alert.alert(t("signup.signupFailed"), data.message || t("signup.driverRegistrationFailed"));
                }
            } catch (error) {
                console.error(error);
                Alert.alert(t("signup.error"), t("signup.driverRegistrationError"));
            } finally {
                setIsUploading(false);
            }
        } else {
            // PASSENGER Signup
            try {
                setIsUploading(true);

                const data = await signupUserApi(name, email, password, "passenger", phone);
                if (data.success) {
                    Alert.alert(
                        "Account Created",
                        "Passenger account created successfully!",

                        [{ text: "Login", onPress: () => router.replace('/(auth)/login') }]
                    );
                } else {
                    Alert.alert("Error", data.message || "Signup failed");
                }
            } catch (error) {
                console.error(error);
                Alert.alert("Error", "Something went wrong during passenger signup.");

            }
            finally {
                setIsUploading(false);
            }
        }
    };
    const isBusy = isUploading;



    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <View style={styles.header}>
                        <Text style={styles.welcomeText}>{t("signup.welcome")}</Text>
                        <Text style={styles.subText}>{t("signup.subtitle")}</Text>
                    </View>

                    <AuthTabSwitcher />

                    <View style={styles.form}>
                        {/* CUSTOM DROPDOWN */}
                        <Text style={styles.label}>{t("signup.registerAs")}</Text>
                        <TouchableOpacity
                            style={styles.dropdownHeader}
                            onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons
                                    name={role === 'passenger' ? "person-outline" : "car-outline"}
                                    size={20} color="#2d5a4c"
                                />
                                <Text style={styles.dropdownHeaderText}>
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                </Text>
                            </View>
                            <Ionicons name={isDropdownOpen ? "chevron-up" : "chevron-down"} size={20} color="#2d5a4c" />
                        </TouchableOpacity>

                        {isDropdownOpen && (
                            <View style={styles.dropdownList}>
                                <TouchableOpacity style={styles.dropdownItem} onPress={() => { setRole('passenger'); setIsDropdownOpen(false); }}>
                                    <Text style={[styles.itemText, role === 'passenger' && styles.activeItemText]}>{t("signup.passenger")}</Text>
                                    {role === 'passenger' && <Ionicons name="checkmark" size={18} color="#2d5a4c" />}
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.dropdownItem, { borderBottomWidth: 0 }]} onPress={() => { setRole('driver'); setIsDropdownOpen(false); }}>
                                    <Text style={[styles.itemText, role === 'driver' && styles.activeItemText]}>{t("signup.driver")}</Text>
                                    {role === 'driver' && <Ionicons name="checkmark" size={18} color="#2d5a4c" />}
                                </TouchableOpacity>
                            </View>
                        )}

                        <Text style={styles.label}>{t("signup.fullName")}</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="person-outline" size={20} color="#666" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder={t("signup.fullNamePlaceholder")}
                                    placeholderTextColor="#A0B4A5"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <Text style={styles.label}>{t("signup.phoneNumber")}</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="call-outline" size={20} color="#666" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder={t("signup.phonePlaceholder")}
                                    placeholderTextColor="#A0B4A5"
                                keyboardType="phone-pad"
                                value={phone}
                                onChangeText={setPhone}
                            />
                        </View>

                        <Text style={styles.label}>{t("signup.emailAddress")}</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="mail-outline" size={20} color="#666" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder={t("signup.emailPlaceholder")}
                                keyboardType="email-address"
                                    placeholderTextColor="#A0B4A5"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        {/* DRIVER EXTRA FIELDS */}
                        {role === 'driver' && (
                            <>
                                <Text style={styles.label}>{t("signup.cnicNumber")}</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="card-outline" size={20} color="#666" style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder={t("signup.cnicPlaceholder")}
                                        value={cnic}
                                        onChangeText={setCnic}
                                        placeholderTextColor="#A0B4A5"
                                    />
                                </View>

                                <Text style={styles.label}>{t("signup.licensePhoto")}</Text>
                                <TouchableOpacity
                                    style={styles.uploadBox}
                                    onPress={async () => {
                                        const uri = await pickImage();

                                        if (uri) {
                                            setImageUri(uri);
                                        }
                                    }}
                                >
                                    {imageUri ? (
                                        <Image source={{ uri: imageUri }} style={styles.previewImage} />
                                    ) : (
                                        <View style={styles.uploadPlaceholder}>
                                            <Ionicons name="camera-outline" size={32} color="#666" />
                                            <Text style={styles.uploadText}>{t("signup.tapToSelectImage")}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}

                        <Text style={styles.label}>{t("signup.password")}</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="key-outline" size={20} color="#666" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder={t("signup.passwordPlaceholder")}
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                                placeholderTextColor="#A0B4A5"
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons
                                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                                    size={20}
                                    color="#666"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.primaryBtn,
                            isBusy ? styles.btnLoadingBg : styles.btnActiveBg
                        ]}
                        onPress={handleSignup}
                        disabled={isBusy}
                    >
                        {isBusy ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.primaryBtnText}>{t("signup.signUp")}</Text>
                        )}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5fdf9' },
    scrollContent: { paddingHorizontal: 25, paddingBottom: 50 },
    header: { alignItems: 'center', marginTop: 40 },
    welcomeText: { fontSize: 32, fontWeight: 'bold', color: '#1a1a1a' },
    subText: { color: '#666', marginTop: 5 },
    form: { marginBottom: 10 },
    label: { fontSize: 14, color: '#333', fontWeight: '600', marginBottom: 8, marginLeft: 5 },
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
    input: { flex: 1, fontSize: 16, color: '#000' },
    primaryBtn: {
        backgroundColor: '#196F31',
        height: 55,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        marginTop: 10
    },
    primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    dropdownHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderRadius: 15,
        paddingHorizontal: 15,
        height: 55,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#eee'
    },
    dropdownHeaderText: { fontSize: 16, color: '#196F31', fontWeight: 'bold', marginLeft: 10 },
    dropdownList: {
        backgroundColor: '#fff',
        borderRadius: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#eee',
        overflow: 'hidden',
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    itemText: { fontSize: 15, color: '#666' },
    activeItemText: { color: '#196F31', fontWeight: 'bold' },
    uploadBox: {
        height: 150,
        backgroundColor: '#fff',
        borderColor: '#eee',
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
        overflow: 'hidden'
    },
    uploadPlaceholder: { alignItems: 'center' },
    uploadText: { marginTop: 8, fontSize: 14, color: '#666' },
    previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    btnActiveBg: {
        backgroundColor: '#196F31',
    },
    btnLoadingBg: {
        backgroundColor: '#A0B4A5',
    },

});