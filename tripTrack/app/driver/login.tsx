import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { useMutation } from '@tanstack/react-query';

import { setCredentials } from '../../redux/authSlice'; 
import { loginUserApi } from '../../service/server'; 

export default function DriverLogin() {
  const dispatch = useDispatch();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: loginUserApi, 
    onSuccess: (data) => {

      dispatch(setCredentials(data));
      Alert.alert("Success", "Welcome Driver!");
      router.back();
    },
    onError: (error) => {
      // Handle error gracefully
      const errorMessage = error?.response?.data?.message || "Login Failed";
      Alert.alert("Error", errorMessage);
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
    <View style={{ flex: 1, padding: 30, justifyContent: 'center', backgroundColor: 'white' }}>
      <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#00C853', marginBottom: 10 }}>Driver Login</Text>
      <Text style={{ fontSize: 16, color: '#666', marginBottom: 30 }}>Enter your credentials to start driving.</Text>
      
      <TextInput 
        placeholder="Email Address" 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ borderWidth: 1, borderColor: '#ddd', padding: 15, marginBottom: 15, borderRadius: 8, fontSize: 16 }}
      />
      
      <TextInput 
        placeholder="Password" 
        secureTextEntry 
        value={password} 
        onChangeText={setPassword} 
        style={{ borderWidth: 1, borderColor: '#ddd', padding: 15, marginBottom: 30, borderRadius: 8, fontSize: 16 }}
      />

      <TouchableOpacity 
        onPress={handleLogin} 
        disabled={mutation.isPending}
        style={{ 
          backgroundColor: '#00C853', 
          padding: 15, 
          borderRadius: 8, 
          alignItems: 'center',
          opacity: mutation.isPending ? 0.7 : 1 
        }}
      >

        {mutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Login</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}