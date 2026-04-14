import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  ScrollView,
  Text,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { signupdriver } from '../../service/server';
import { Colors } from '../../constants/theme';

export default function DriverSignupScreen() {
  const router = useRouter();

  const theme = useColorScheme() ?? 'light';
  const activeColors = Colors[theme];

  const inputBgColor = activeColors.inputBackground;
  const borderColor = activeColors.inputBorder;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [cnic, setCnic] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadToCloudinary = async (uri) => {
    const data = new FormData();
    data.append('file', {
      uri: uri,
      type: 'image/jpeg',
      name: 'driver_license.jpg',
    });

    
    const cloudName = "dsrl10j73";
    data.append('upload_preset', 'transit-app');

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: data,
    });

    const result = await response.json();
    console.log("Cloudinary response:", result);
    if (result.secure_url) {
      return result.secure_url;
    } else {
      throw new Error("Failed to upload image");
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to allow camera roll access to upload your license.");
      return;
    }

  const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ['images'], 
  allowsEditing: true,
  aspect: [1, 1], 
  quality: 0.5,
});
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const mutation = useMutation({
    mutationFn: ({ name, email, password, phone, cnic, driverLicense }) => {
      return signupdriver(name, email, password, 'driver', phone, cnic, driverLicense);
    },
    onSuccess: (data) => {
      if (data.success) {
        Alert.alert(
          "Application Submitted!",
          "Your driver account has been created and is currently under review. Please wait for Admin approval.",
          [
            {
              text: "Return to Login",
              onPress: () => router.replace('./login'),
            }
          ]
        );
      } else {
        Alert.alert("Registration Failed", data.message || "Could not create account");
      }
    },
    onError: (error) => {
      const msg = typeof error === 'string' ? error : (error.message || "Signup failed");
      Alert.alert("Error", msg);
    }
  });


  const handleSignup = async () => {
    // 1. Validation
    if (!name || !email || !password || !phone || !cnic) {
      Alert.alert("Missing Input", "Please fill in all text fields.");
      return;
    }
    if (!imageUri) {
      Alert.alert("License Required", "Please upload a photo of your Driver's License.");
      return;
    }

    try {
      setIsUploading(true);
      const uploadedLicenseUrl = await uploadToCloudinary(imageUri);

      mutation.mutate({
        name,
        email,
        password,
        phone,
        cnic,
        driverLicense: uploadedLicenseUrl
      });
    } catch (error) {
      Alert.alert("Upload Error", "There was a problem uploading your license. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const isBusy = isUploading || mutation.isPending;

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          disabled={isBusy}
        >
          <Ionicons name="arrow-back" size={24} color={activeColors.text} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerContainer}>
            <ThemedText type="title" style={styles.title}>
              Driver Registration
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Join our fleet. Please provide your details and license below.
            </ThemedText>
          </View>

          <View style={[styles.inputContainer, { backgroundColor: inputBgColor, borderColor: borderColor }]}>
            <Ionicons name="person-outline" size={20} color={activeColors.icon} style={styles.inputIcon} />
            <TextInput
              placeholder="Full Name"
              placeholderTextColor={activeColors.placeholder}
              style={[styles.input, { color: activeColors.text }]}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: inputBgColor, borderColor: borderColor }]}>
            <Ionicons name="mail-outline" size={20} color={activeColors.icon} style={styles.inputIcon} />
            <TextInput
              placeholder="Email Address"
              placeholderTextColor={activeColors.placeholder}
              style={[styles.input, { color: activeColors.text }]}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: inputBgColor, borderColor: borderColor }]}>
            <Ionicons name="call-outline" size={20} color={activeColors.icon} style={styles.inputIcon} />
            <TextInput
              placeholder="Phone Number"
              placeholderTextColor={activeColors.placeholder}
              style={[styles.input, { color: activeColors.text }]}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>
          <View style={[styles.inputContainer, { backgroundColor: inputBgColor, borderColor: borderColor }]}>
            <Ionicons name="card-outline" size={20} color={activeColors.icon} style={styles.inputIcon} />
            <TextInput
              placeholder="CNIC (e.g. 42101-1234567-1)"
              placeholderTextColor={activeColors.placeholder}
              style={[styles.input, { color: activeColors.text }]}
              keyboardType="number-pad"
              value={cnic}
              onChangeText={setCnic}
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: inputBgColor, borderColor: borderColor }]}>
            <Ionicons name="lock-closed-outline" size={20} color={activeColors.icon} style={styles.inputIcon} />
            <TextInput
              placeholder="Password"
              placeholderTextColor={activeColors.placeholder}
              style={[styles.input, { color: activeColors.text }]}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
          <Text style={[styles.uploadLabel, { color: activeColors.text }]}>Driver's License Photo</Text>
          <TouchableOpacity
            style={[styles.uploadBox, { backgroundColor: inputBgColor, borderColor: borderColor }]}
            onPress={pickImage}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="camera-outline" size={32} color={activeColors.placeholder} />
                <Text style={[styles.uploadText, { color: activeColors.placeholder }]}>Tap to select image</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSignup}
            disabled={isBusy}
            style={[
              styles.mainButton,
              {
                backgroundColor: activeColors.primary,
                opacity: isBusy ? 0.7 : 1
              }
            ]}
          >
            {isBusy ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color="white" />
                <Text style={styles.mainButtonText}>
                  {isUploading ? "Uploading License..." : "Registering..."}
                </Text>
              </View>
            ) : (
              <Text style={styles.mainButtonText}>
                Submit Application
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>
              Already have a driver account?{' '}
            </ThemedText>
            <TouchableOpacity onPress={() => router.replace('./login')}>
              <Text style={styles.linkText}>
                Log In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  keyboardView: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 30,
    paddingTop: 80
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 10
  },
  headerContainer: {
    marginBottom: 30
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#00C853'
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 55,
    borderWidth: 1
  },
  inputIcon: {
    marginRight: 10
  },
  input: {
    flex: 1,
    fontSize: 16
  },
  uploadLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 5,
    marginBottom: 10,
    marginLeft: 5
  },
  uploadBox: {
    height: 150,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    overflow: 'hidden'
  },
  uploadPlaceholder: {
    alignItems: 'center'
  },
  uploadText: {
    marginTop: 8,
    fontSize: 14
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  mainButton: {
    borderRadius: 12,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#00C853',
    shadowOpacity: 0.3,
    shadowOffset: {
      width: 0,
      height: 4
    },
    elevation: 4
  },
  mainButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 20
  },
  footerText: {
    fontSize: 15,
    opacity: 0.7
  },
  linkText: {
    color: '#00C853',
    fontWeight: 'bold',
    fontSize: 15
  }
});