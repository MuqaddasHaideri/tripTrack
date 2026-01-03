import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
// Note: We don't import useDispatch here anymore because we are not logging in automatically
// Your backend signup doesn't return a token, so we must redirect to login.

import { signupUserApi } from '../../service/server'; 

export default function PassengerSignupScreen() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      // API call (Role 'passenger' is actually hardcoded in your backend, 
      // but passing it doesn't hurt)
      const data = await signupUserApi(name, email, password, 'passenger');

      if (data.success) {
        // --- LOGIC CHANGE ---
        // Your signup controller does NOT return a token.
        // So we cannot dispatch setCredentials.
        // We must tell the user to Login.
        
        Alert.alert(
          "Account Created", 
          "Your account has been created successfully. Please log in.",
          [
            { text: "OK", onPress: () => router.replace('/passenger/login') }
          ]
        );
      } else {
         Alert.alert("Signup Failed", data.message || "Could not create account");
      }

    } catch (error) {
      console.log(error);
      const msg = typeof error === 'string' ? error : (error.message || "Signup failed");
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to track buses and save routes.</Text>
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput 
            placeholder="Full Name" 
            style={styles.input} 
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput 
            placeholder="Email Address" 
            style={styles.input} 
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput 
            placeholder="Password" 
            style={styles.input} 
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity style={styles.mainButton} onPress={handleSignup} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.mainButtonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/passenger/login')}>
            <Text style={styles.linkText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10, padding: 10 },
  content: { flex: 1, justifyContent: 'center', padding: 30 },
  headerContainer: { marginBottom: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666' },
  inputContainer: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', 
    borderRadius: 12, marginBottom: 15, paddingHorizontal: 15, height: 55,
    borderWidth: 1, borderColor: '#eee'
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333' },
  mainButton: {
    backgroundColor: '#00C853', borderRadius: 12, height: 55,
    justifyContent: 'center', alignItems: 'center', marginTop: 10,
    shadowColor: '#00C853', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, elevation: 4
  },
  mainButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  footerText: { color: '#666', fontSize: 15 },
  linkText: { color: '#00C853', fontWeight: 'bold', fontSize: 15 },
});