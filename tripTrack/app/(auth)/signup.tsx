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
export default function SignupScreen() {
    const router = useRouter();

    const [role, setRole] = useState('passenger');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [cnic, setCnic] = useState('');
    const [showPassword, setShowPassword] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [imageUri, setImageUri] = useState(null);
    const handleSignup = async () => {
        if (!name || !email || !password || !phone) {
            Alert.alert("Missing Input", "Please fill in all basic text fields.");
            return;
        }
        if (role === 'driver') {
            // Driver Validation
            if (!cnic) {
                Alert.alert("Missing Input", "CNIC is required for drivers.");
                return;
            }
            if (!imageUri) {
                Alert.alert("License Required", "Please upload a photo of your Driver's License.");
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
                    // ✅ FIX 1: Use the backend's message
                    // ✅ FIX 2: Route to the Verify screen and pass the email!
                    Alert.alert("Success", data.message, [
                        { 
                            text: "Verify Email", 
                            onPress: () => router.push({ pathname: '/(auth)/verifyOTP', params: { email: email } }) 
                        }
                    ]);
                } else {
                    Alert.alert("Signup Failed", data.message || "Could not register driver.");
                }

            } catch (error) {
                console.error(error);
                Alert.alert("Error", "There was a problem during driver registration.");
            } finally {
                setIsUploading(false);
            }

        } else {
            // PASSENGER Signup
            try {
                const data = await signupUserApi(name, email, password, "passenger", phone);

               if (data.success) {
                    // ✅ FIX 1: Use the backend's message
                    // ✅ FIX 2: Route to the Verify screen and pass the email!
                    Alert.alert("Success", data.message, [
                        { 
                            text: "Verify Email", 
                            onPress: () => router.push({ pathname: '/(auth)/verifyOTP', params: { email: email } }) 
                        }
                    ]);
                } else {
                    Alert.alert("Error", data.message || "Signup failed");
                }
            } catch (error) {
                console.error(error);
                Alert.alert("Error", "Something went wrong during passenger signup.");
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
                        <Text style={styles.welcomeText}>Welcome</Text>
                        <Text style={styles.subText}>Hi, you need to register to enter</Text>
                    </View>

                    <AuthTabSwitcher />

                    <View style={styles.form}>
                        {/* CUSTOM DROPDOWN */}
                        <Text style={styles.label}>Register as</Text>
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
                                    <Text style={[styles.itemText, role === 'passenger' && styles.activeItemText]}>Passenger</Text>
                                    {role === 'passenger' && <Ionicons name="checkmark" size={18} color="#2d5a4c" />}
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.dropdownItem, { borderBottomWidth: 0 }]} onPress={() => { setRole('driver'); setIsDropdownOpen(false); }}>
                                    <Text style={[styles.itemText, role === 'driver' && styles.activeItemText]}>Driver</Text>
                                    {role === 'driver' && <Ionicons name="checkmark" size={18} color="#2d5a4c" />}
                                </TouchableOpacity>
                            </View>
                        )}

                        <Text style={styles.label}>Full Name</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="person-outline" size={20} color="#666" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your full name"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <Text style={styles.label}>Your Number</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="call-outline" size={20} color="#666" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="+92 XXX-XXXXXXX"
                                keyboardType="phone-pad"
                                value={phone}
                                onChangeText={setPhone}
                            />
                        </View>

                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="mail-outline" size={20} color="#666" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="example@gmail.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        {/* DRIVER EXTRA FIELDS */}
                        {role === 'driver' && (
                            <>
                                <Text style={styles.label}>CNIC Number</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="card-outline" size={20} color="#666" style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="42101-XXXXXXX-X"
                                        value={cnic}
                                        onChangeText={setCnic}
                                    />
                                </View>

                                <Text style={styles.label}>Driver's License Photo</Text>
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
                                            <Text style={styles.uploadText}>Tap to select image</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}

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
                    </View>
                    <TouchableOpacity
                        style={[styles.primaryBtn, isBusy && { opacity: 0.7 }]}
                        onPress={handleSignup}
                        disabled={isBusy}
                    >
                        {isBusy ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.primaryBtnText}>Sign Up</Text>
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
});