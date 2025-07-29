import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from "react-native";
import {
  TextInput,
  Button,
  Text,
  Card,
  Title,
  Snackbar,
  Surface,
  IconButton,
} from "react-native-paper";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { loginUser } from "../../utils/api";
import { jwtDecode } from "jwt-decode";
import * as Animatable from "react-native-animatable";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { commonStyles } from "@/styles/commonStyles";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingLogin, setCheckingLogin] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const storedUserId = await SecureStore.getItemAsync("userId");
      if (storedUserId) {
        router.replace("/(tabs)");
      } else {
        setCheckingLogin(false);
      }
    };

    checkAuth();
  }, [router]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    let isValid = true;

    // Reset errors
    setEmailError("");
    setPasswordError("");
    setError("");

    // Email validation
    if (!email.trim()) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }

    // Password validation
    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await loginUser(email.toLowerCase().trim(), password);
      const { token, user } = response;

      const decoded: any = jwtDecode(token);
      const userId = decoded.userId;

      // Store user data
      await SecureStore.setItemAsync("userId", userId);
      await SecureStore.setItemAsync("userToken", token);
      if (user?.name) await SecureStore.setItemAsync("userName", user.name);
      if (user?.email) await SecureStore.setItemAsync("userEmail", user.email);

      router.replace("/(tabs)");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Login failed. Please check your credentials.");
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  if (checkingLogin) {
    return (
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={commonStyles.loadingContainer}
      >
        <Animatable.View animation="pulse" iterationCount="infinite">
          <MaterialIcons name="school" size={64} color="white" />
        </Animatable.View>
        <Text style={commonStyles.loadingText}>EduPlanner</Text>
        <ActivityIndicator
          size="large"
          color="white"
          style={{ marginTop: 20 }}
        />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#667eea", "#764ba2"]}
      style={commonStyles.gradient}
    >
      <KeyboardAvoidingView
        style={commonStyles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={commonStyles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <Animatable.View
            animation="fadeInDown"
            duration={1000}
            style={commonStyles.header}
          >
            <Surface
              style={[commonStyles.logoContainer, { marginTop: 40 }]}
              elevation={4}
            >
              <MaterialIcons name="school" size={48} color="#6366f1" />
            </Surface>
            <Title style={commonStyles.appTitle}>EduPlanner</Title>
            <Text style={commonStyles.subtitle}>
              Your AI-Powered Study Companion
            </Text>
          </Animatable.View>

          {/* Login Form */}
          <Animatable.View animation="fadeInUp" duration={1000} delay={300}>
            <Card style={commonStyles.card} elevation={4}>
              <Card.Content style={commonStyles.cardContent}>
                <Title style={commonStyles.title}>Log In to Explore!</Title>
                <Text style={commonStyles.description}>
                  Sign in to continue your learning journey
                </Text>

                {/* Email Input */}
                <View style={commonStyles.inputContainer}>
                  <TextInput
                    label="Email Address"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (emailError) setEmailError("");
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    style={commonStyles.input}
                    mode="outlined"
                    error={!!emailError}
                    left={<TextInput.Icon icon="email" />}
                    theme={{
                      colors: {
                        primary: "#6366f1",
                        outline: emailError ? "#ef4444" : "#d1d5db",
                      },
                    }}
                  />
                  {emailError ? (
                    <Text style={commonStyles.errorText}>{emailError}</Text>
                  ) : null}
                </View>

                {/* Password Input */}
                <View style={commonStyles.inputContainer}>
                  <TextInput
                    label="Password"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (passwordError) setPasswordError("");
                    }}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    style={commonStyles.input}
                    mode="outlined"
                    error={!!passwordError}
                    left={<TextInput.Icon icon="lock" />}
                    right={
                      <TextInput.Icon
                        icon={showPassword ? "eye-off" : "eye"}
                        onPress={() => setShowPassword(!showPassword)}
                      />
                    }
                    theme={{
                      colors: {
                        primary: "#6366f1",
                        outline: passwordError ? "#ef4444" : "#d1d5db",
                      },
                    }}
                  />
                  {passwordError ? (
                    <Text style={commonStyles.errorText}>{passwordError}</Text>
                  ) : null}
                </View>

                {/* Forgot Password */}
                <Button
                  mode="text"
                  onPress={() => {
                    // Navigate to forgot password screen
                    console.log("Forgot password pressed");
                  }}
                  style={styles.forgotButton}
                  labelStyle={styles.forgotButtonText}
                >
                  Forgot Password?
                </Button>

                {/* Login Button */}
                <Animatable.View
                  animation="pulse"
                  iterationCount={loading ? "infinite" : 1}
                >
                  <Button
                    mode="contained"
                    onPress={handleLogin}
                    style={styles.loginButton}
                    contentStyle={styles.loginButtonContent}
                    loading={loading}
                    disabled={loading}
                    icon={loading ? undefined : "login"}
                    buttonColor="#6366f1"
                  >
                    {loading ? "Signing In..." : "Sign In"}
                  </Button>
                </Animatable.View>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Social Login Buttons */}
                <View style={styles.socialContainer}>
                  <IconButton
                    icon="google"
                    size={24}
                    iconColor="#db4437"
                    style={styles.socialButton}
                    onPress={() => console.log("Google login")}
                  />
                  <IconButton
                    icon="apple"
                    size={24}
                    iconColor="#000"
                    style={styles.socialButton}
                    onPress={() => console.log("Apple login")}
                  />
                  <IconButton
                    icon="facebook"
                    size={24}
                    iconColor="#4267B2"
                    style={styles.socialButton}
                    onPress={() => console.log("Facebook login")}
                  />
                </View>

                {/* Sign Up Link */}
                <View style={styles.signupContainer}>
                  <Text style={styles.signupText}>Dont have an account?</Text>
                  <Button
                    mode="text"
                    onPress={() => router.push("/signup")}
                    labelStyle={styles.signupButtonText}
                    compact
                  >
                    Sign Up
                  </Button>
                </View>
              </Card.Content>
            </Card>
          </Animatable.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={[
          commonStyles.snackbar,
          { backgroundColor: error ? "#ef4444" : "#10b981" },
        ]}
      >
        {error}
      </Snackbar>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  forgotButton: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotButtonText: {
    color: "#6366f1",
    fontSize: 14,
  },
  loginButton: {
    borderRadius: 12,
    marginBottom: 24,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#9ca3af",
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  socialButton: {
    backgroundColor: "#f9fafb",
    marginHorizontal: 8,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signupText: {
    color: "#6b7280",
    fontSize: 16,
  },
  signupButtonText: {
    color: "#6366f1",
    fontSize: 16,
    fontWeight: "600",
  },
});
