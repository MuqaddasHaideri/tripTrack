import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity,
    ScrollView, Alert, ActivityIndicator, Image, StatusBar, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    pickImage,
    uploadToCloudinary,
} from '@/utils/pickImage';
import { useDispatch, useSelector } from 'react-redux';
import {
    getUserProfileApi,
    updateUserProfileApi,
    deleteUserProfileApi
} from '../../service/server';
import { deleteAccount, updateUser } from '../../redux/authSlice';
import { useTranslation } from 'react-i18next';
export default function ProfileScreen() {
    const router = useRouter();
    const dispatch = useDispatch();
    const { token } = useSelector((state) => state.auth);

    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [profile, setProfile] = useState({ name: '', email: '', phone: '', profilePic: '' });
    const [originalProfile, setOriginalProfile] = useState({});
    const [newImageUri, setNewImageUri] = useState(null);
    const { t } = useTranslation();
    useEffect(() => {
        if (token) {
            fetchProfile(token);
        }
    }, [token]);

    const fetchProfile = async (currentToken) => {
        if (!currentToken) return;

        setLoading(true);
        try {
            const result = await getUserProfileApi(currentToken);

            console.log("Full API Result:", result);

            if (result && result.success && result.user) {
                const userData = result.user;
                const formatted = {
                    name: userData.name || '',
                    email: userData.email || '',
                    phone: userData.phone || '',
                    profilePic: userData.profilePic || '',
                    role: userData.role || 'passenger'
                };
                setProfile(formatted);
                setOriginalProfile(formatted);
            } else {
                Alert.alert(t("profileScreen.profileError"), t("profileScreen.profileNotFound"));
            }
        } catch (error) {
            console.error("Catch Block Error:", error);
            Alert.alert(t("profileScreen.connectionError"), t("profileScreen.cannotReachServer"));
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!profile.name || !profile.phone) {
            Alert.alert(t("profileScreen.profileError"), t("profileScreen.namePhoneRequired"));
            return;
        }

        try {
            setIsUploading(true);
            let finalImageUrl = profile.profilePic;
            if (newImageUri) {
                finalImageUrl = await uploadToCloudinary(newImageUri);
            }

            const updateData = {
                ...profile,
                profilePic: finalImageUrl
            };

            const result = await updateUserProfileApi(updateData, token);

            if (result.success) {
                dispatch(updateUser(result.user || updateData));
                Alert.alert(t("profileScreen.success"), t("profileScreen.profileUpdated"));

                setIsEditing(false);
                setNewImageUri(null);
                setOriginalProfile(updateData);
            } else {
                Alert.alert(t("profileScreen.updateFailed"), t("profileScreen.updateProfileFailed"));
            }
        } catch (error) {
            Alert.alert(t("profileScreen.profileError"), t("profileScreen.failedToUpdateProfile"));
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            t('profileScreen.deleteAccount'),
            t('profileScreen.deleteConfirmation'),
            [
                { text: t('profileScreen.Cancel'), style: "cancel" },
                {
                    text: t('profileScreen.Delete'),
                    style: "destructive",
                    onPress: async () => {
                        const result = await deleteUserProfileApi(token);
                        if (result.success) {
                            dispatch(deleteAccount());
                            router.replace('/(auth)/login');
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#196F31" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.headerBackground} />

            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backCircleBtn}
                    >
                        <Ionicons name="arrow-back" size={22} color="#000" />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>{t('profileScreen.Profile Settings')}</Text>

                    <TouchableOpacity
                        onPress={() => isEditing ? handleUpdate() : setIsEditing(true)}
                        disabled={isUploading}
                        style={styles.editHeaderBtn}
                    >
                        {isUploading ? (
                            <ActivityIndicator size="small" color="#196F31" />
                        ) : (
                            <>
                                <Text style={styles.editHeaderText}>{isEditing ? t('profileScreen.Save') : t('profileScreen.Edit')}</Text>
                                <Ionicons
                                    name={isEditing ? "checkmark-circle" : "create-outline"}
                                    size={18}
                                    color="#196F31"
                                />
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarWrapper}>
                            <Image
                                source={{ uri: profile.profilePic || 'https://via.placeholder.com/150' }}
                                style={styles.avatarImg}
                            />
                            {isEditing && (
                                <TouchableOpacity style={styles.cameraIcon} onPress={async () => {
                                    const uri = await pickImage();

                                    if (uri) {
                                        setNewImageUri(uri);

                                        setProfile(prev => ({
                                            ...prev,
                                            profilePic: uri
                                        }));
                                    }
                                }}>
                                    <Ionicons name="camera" size={20} color="white" />
                                </TouchableOpacity>
                            )}
                        </View>
                        <Text style={styles.profileName}>{profile.name || "User"}</Text>
                        <View style={styles.roleBadge}>
                            <Text style={styles.profileRole}>{profile.role?.toUpperCase() || 'PASSENGER'}</Text>
                        </View>
                    </View>

                    <View style={styles.mainCard}>
                        <Text style={styles.sectionLabel}>{t('profileScreen.ACCOUNT INFORMATION')}</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>{t('profileScreen.Full Name')}</Text>
                            <View style={[styles.inputField, !isEditing && styles.disabledField]}>
                                <Ionicons name="person-outline" size={20} color={isEditing ? "#196F31" : "#A0B4A5"} />
                                <TextInput
                                    style={styles.textInput}
                                    value={profile.name}
                                    editable={isEditing}
                                    onChangeText={(v) => setProfile({ ...profile, name: v })}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>{t('profileScreen.Phone Number')}</Text>
                            <View style={[styles.inputField, !isEditing && styles.disabledField]}>
                                <Ionicons name="call-outline" size={20} color={isEditing ? "#196F31" : "#A0B4A5"} />
                                <TextInput
                                    style={styles.textInput}
                                    value={profile.phone}
                                    editable={isEditing}
                                    keyboardType="phone-pad"
                                    onChangeText={(v) => setProfile({ ...profile, phone: v })}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>{t('profileScreen.Email Address')}</Text>
                            <View style={[styles.inputField, styles.disabledField]}>
                                <Ionicons name="mail-outline" size={20} color="#A0B4A5" />
                                <TextInput
                                    style={[styles.textInput, { color: '#8E8E93' }]}
                                    value={profile.email}
                                    editable={false}
                                />
                            </View>
                        </View>
                    </View>

                    {/* --- FOOTER ACTIONS --- */}
                    <View style={styles.footer}>
                        {isEditing ? (
                            <TouchableOpacity
                                style={styles.discardBtn}
                                onPress={() => { setIsEditing(false); setProfile(originalProfile); setNewImageUri(null); }}
                            >
                                <Ionicons name="close-circle-outline" size={20} color="#8E8E93" />
                                <Text style={styles.discardBtnText}>{t('profileScreen.Discard Changes')}</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                <Text style={styles.deleteBtnText}>{t('profileScreen.Delete Account')}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F9F4' },
    headerBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 200,
        backgroundColor: '#E1F2E8',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backCircleBtn: {
   width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E8F3EB',
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5,
    },
    editHeaderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#196F31',
        gap: 8,
    },
    editHeaderText: {
        color: '#196F31',
        fontWeight: '800',
        fontSize: 14,
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#123D1F' },
    avatarSection: { alignItems: 'center', marginTop: 10, marginBottom: 25 },
    avatarWrapper: {
        padding: 4,
        backgroundColor: '#FFF',
        borderRadius: 65,
        elevation: 8,
        shadowColor: '#196F31',
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    avatarImg: { width: 120, height: 120, borderRadius: 60 },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#196F31',
        padding: 10,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#FFF',
    },
    profileName: { fontSize: 26, fontWeight: '900', color: '#123D1F', marginTop: 15 },
    roleBadge: {
        backgroundColor: '#196F31',
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 12,
        marginTop: 8
    },
    profileRole: { fontSize: 11, color: '#FFF', fontWeight: '800' },

    mainCard: {
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        borderRadius: 28,
        padding: 24,
        borderWidth: 1,
        borderColor: '#E8F3EB',
    },
    sectionLabel: { fontSize: 12, fontWeight: '800', color: '#A0B4A5', marginBottom: 25, letterSpacing: 1.2 },
    inputGroup: { marginBottom: 22 },
    inputLabel: { fontSize: 13, fontWeight: '700', color: '#4A6B54', marginBottom: 8, marginLeft: 4 },
    inputField: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FBF9',
        borderWidth: 1.5,
        borderColor: '#196F31',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 58,
    },
    disabledField: { borderColor: '#F0F4F1' },
    textInput: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '700', color: '#123D1F' },
    footer: { marginTop: 30, paddingHorizontal: 20 },
    deleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: '#FF3B30',
        backgroundColor: '#FFF',
        gap: 10,
    },
    deleteBtnText: { color: '#FF3B30', fontWeight: '800', fontSize: 16 },

    discardBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: '#8E8E93',
        backgroundColor: '#FFF',
        gap: 10,
    },
    discardBtnText: { color: '#8E8E93', fontWeight: '800', fontSize: 16 },

    scrollContent: { paddingBottom: 40 }
});