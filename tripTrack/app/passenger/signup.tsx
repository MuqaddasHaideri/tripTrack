import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  useColorScheme,
  Text,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "../../components/themed-text";
import { ThemedView } from "../../components/themed-view";
import { signupUserApi } from "../../service/server";
import { Colors } from "../../constants/theme";

export default function PassengerSignupScreen() {
  const router = useRouter();

  const theme = useColorScheme() ?? "light";
  const activeColors = Colors[theme];
  const inputBgColor = activeColors.inputBackground;
  const borderColor = activeColors.inputBorder;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const data = await signupUserApi(
        name,
        email,
        password,
        "passenger",
        phone
      );

      if (data.success) {
        Alert.alert(
          "Account Created",
          "Your account has been created successfully. Please log in.",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert(
          "Signup Failed",
          data.message || "Could not create account"
        );
      }
    } catch (error) {
      console.log(error);
      const msg =
        typeof error === "string" ? error : error.message || "Signup failed";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
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
          <Ionicons name="arrow-back" size={24} color={activeColors.text} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.headerContainer}>
            <ThemedText type="title" style={styles.title}>
              Create Account
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Sign up to track buses and save routes.
            </ThemedText>
          </View>

          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: inputBgColor,
                borderColor: borderColor,
              },
            ]}
          >
            <Ionicons
              name="person-outline"
              size={20}
              color={activeColors.icon}
              style={styles.inputIcon}
            />
            <TextInput
              placeholder="Full Name"
              placeholderTextColor={activeColors.placeholder}
              style={[styles.input, { color: activeColors.text }]}
              value={name}
              onChangeText={setName}
            />
          </View>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: inputBgColor, borderColor: borderColor },
            ]}
          >
            <Ionicons
              name="call-outline"
              size={20}
              color={activeColors.icon}
              style={styles.inputIcon}
            />
            <TextInput
              placeholder="Phone Number"
              placeholderTextColor={activeColors.placeholder}
              style={[styles.input, { color: activeColors.text }]}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: inputBgColor,
                borderColor: borderColor,
              },
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
              style={[styles.input, { color: activeColors.text }]}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: inputBgColor,
                borderColor: borderColor,
              },
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
              style={[styles.input, { color: activeColors.text }]}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            style={styles.mainButton}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.mainButtonText}>Sign Up</Text>
            )}
          </TouchableOpacity>
          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>
              Already have an account?{" "}
            </ThemedText>
            <TouchableOpacity onPress={() => router.replace("./login")}>
              <Text style={styles.linkText}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 30,
  },
  headerContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 55,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  mainButton: {
    backgroundColor: "#00C853",
    borderRadius: 12,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#00C853",
    shadowOpacity: 0.3,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 4,
  },
  mainButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
  footerText: {
    fontSize: 15,
    opacity: 0.7,
  },
  linkText: {
    color: "#00C853",
    fontWeight: "bold",
    fontSize: 15,
  },
});
