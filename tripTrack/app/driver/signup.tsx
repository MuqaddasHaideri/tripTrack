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
  Text
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';

// --- IMPORTS ---
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { signupUserApi } from '../../service/server'; 
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

  const mutation = useMutation({
    mutationFn: ({ name, email, password, phone }) => {
      return signupUserApi(name, email, password, 'driver', phone);
    },
    onSuccess: (data) => {
      if (data.success) {
        Alert.alert(
          "Registration Successful", 
          "Your driver account has been created. Please log in to continue.",
          [
            { 
              text: "Go to Login", 
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

  const handleSignup = () => {
    if (!name || !email || !password || !phone) {
      Alert.alert("Missing Input", "Please fill in all fields.");
      return;
    }

    mutation.mutate({ name, email, password, phone });
  };

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
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={activeColors.text} 
          />
        </TouchableOpacity>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <ThemedText type="title" style={styles.title}>
              Driver Registration
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Join our fleet. Please provide your details below.
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

          <TouchableOpacity 
            onPress={handleSignup} 
            disabled={mutation.isPending}
            style={[
              styles.mainButton,
              { 
                backgroundColor: activeColors.primary,
                opacity: mutation.isPending ? 0.7 : 1 
              }
            ]}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.mainButtonText}>
                Register as Driver
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