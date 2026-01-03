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
import { useDispatch } from 'react-redux';

import { setCredentials } from '../../redux/authSlice';
import { loginUserApi } from '../../service/server'; 

export default function PassengerLoginScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  
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
      const data = await loginUserApi(email, password);
      
      // --- CRITICAL UPDATE FOR YOUR CONTROLLER ---
      // Your controller returns: { jwt_token, _id, name, email, role, ... }
      
      if (data.success) {
        // 1. Construct the user object from the flat response
        const userObj = {
          id: data._id,      // Controller returns '_id'
          name: data.name,   // Controller returns 'name'
          email: data.email, // Controller returns 'email'
          role: data.role    // Controller returns 'role'
        };

        // 2. Dispatch with the correct token key ('jwt_token')
        dispatch(setCredentials({ 
          user: userObj, 
          token: data.jwt_token 
        }));

        Alert.alert("Success", "Welcome back!");
        router.replace('/'); 
      } else {
        Alert.alert("Login Failed", data.message || "Invalid credentials");
      }

    } catch (error) {
      console.log(error);
      const msg = typeof error === 'string' ? error : (error.message || "Login failed");
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
          <Text style={styles.title}>Passenger Login</Text>
          <Text style={styles.subtitle}>Login to manage your rides.</Text>
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

        <TouchableOpacity style={styles.mainButton} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.mainButtonText}>Log In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/passenger/signup')}>
            <Text style={styles.linkText}>Sign Up</Text>
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