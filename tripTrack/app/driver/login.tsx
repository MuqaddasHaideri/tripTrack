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
  Text 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { setCredentials } from '../../redux/authSlice'; 
import { loginUserApi } from '../../service/server'; 
import { Colors } from '../../constants/theme'; 

export default function DriverLogin() {
  const dispatch = useDispatch();
  const router = useRouter();

  const theme = useColorScheme() ?? 'light';
  const activeColors = Colors[theme];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: ({ email, password }) => loginUserApi(email, password, 'driver'),
    
    onSuccess: (data) => {
      if (data.success) {

        if (data.role !== 'driver') {
          Alert.alert("Access Denied", "This area is for drivers only.");
          return;
        }

        const userObj = {
          id: data._id,
          name: data.name,
          email: data.email,
          role: data.role
        };

        dispatch(setCredentials({ 
          user: userObj, 
          token: data.jwt_token 
        }));

        Alert.alert("Success", "Welcome Driver!");
        router.replace('/'); 
      } else {
        Alert.alert("Login Failed", data.message || "Invalid credentials");
      }
    },
    onError: (error) => {
      console.log(error);
      const msg = typeof error === 'string' ? error : (error.message || "Login failed");
      Alert.alert("Error", msg);
    }
  });

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert("Missing Input", "Please enter both email and password");
      return;
    }
    mutation.mutate({ email, password });
  };



  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.keyboardView}
      >
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

        <View style={styles.content}>
          <View style={styles.headerContainer}>
            <ThemedText type="title" style={styles.title}>
              Driver Login
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Enter your credentials to start driving.
            </ThemedText>
          </View>
          
          {/* Email Input */}
          <View 
            style={[
              styles.inputContainer, 
              { 
                backgroundColor: activeColors.inputBackground,
                borderColor: activeColors.inputBorder 
              }
            ]}
          >
            <Ionicons 
              name="mail-outline" 
              size={20} 
              color={activeColors.icon} 
              style={styles.inputIcon} 
            />
            <TextInput 
              placeholder="Email Address" 
              placeholderTextColor={activeColors.placeholder}
              value={email} 
              onChangeText={setEmail} 
              autoCapitalize="none"
              keyboardType="email-address"
              style={[
                styles.input, 
                { color: activeColors.text }
              ]}
            />
          </View>
          
          <View 
            style={[
              styles.inputContainer, 
              { 
                backgroundColor: activeColors.inputBackground,
                borderColor: activeColors.inputBorder 
              }
            ]}
          >
            <Ionicons 
              name="lock-closed-outline" 
              size={20} 
              color={activeColors.icon} 
              style={styles.inputIcon} 
            />
            <TextInput 
              placeholder="Password" 
              placeholderTextColor={activeColors.placeholder}
              secureTextEntry 
              value={password} 
              onChangeText={setPassword} 
              style={[
                styles.input, 
                { color: activeColors.text }
              ]}
            />
          </View>

          {/* Login Button */}
          <TouchableOpacity 
            onPress={handleLogin} 
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
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText 
                style={styles.mainButtonText}
                lightColor="#fff"
                darkColor="#fff"
              >
                Login
              </ThemedText>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>
              Don't have a driver account?{' '}
            </ThemedText>
            <TouchableOpacity onPress={() => router.replace('./signup')}>
              <Text style={styles.linkText}>
                Register Here
              </Text>
            </TouchableOpacity>
          </View>

        </View>
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
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 10
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 30
  },
  headerContainer: {
    marginBottom: 40
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
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    height: 55,
    justifyContent: 'center',
    shadowColor: '#00C853',
    shadowOpacity: 0.3,
    shadowOffset: {
      width: 0,
      height: 4
    },
    elevation: 4
  },
  mainButtonText: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30
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