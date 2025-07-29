import React, { useEffect, useState } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  StyleSheet,
} from "react-native";
import {
  Button,
  Text,
  Card,
  Title,
  TextInput,
  Surface,
  HelperText,
  Snackbar,
} from "react-native-paper";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { signupUser } from "../../utils/api";
import { jwtDecode } from "jwt-decode";
import * as Animatable from "react-native-animatable";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { commonStyles } from "../../styles/commonStyles";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [checkingLogin, setCheckingLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Form validation errors
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

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
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    // Name validation
    if (!name.trim()) {
      setNameError("Name is required");
      isValid = false;
    } else if (name.trim().length < 2) {
      setNameError("Name must be at least 2 characters");
      isValid = false;
    }

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

    // Confirm password validation
    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password");
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      isValid = false;
    }

    return isValid;
  };

  const handleSignup = async () => {
    try {
      setLoading(true);
      console.log("Starting signup process.....");
      const res = await signupUser({ name, email, password }); // Pass name
      console.log("Signup success:", res);
      const { token } = res;
      const decoded: any = jwtDecode(token);
      const userId = decoded.userId;
      await SecureStore.setItemAsync("userId", userId);
      setLoading(false);
      router.replace("/(auth)/login");
    } catch (err: any) {
      setSnackbarMessage(err.message || "Signup failed");
      setSnackbarVisible(true);
    }
  };

  if (checkingLogin) {
    return (
      <LinearGradient
        colors={["#4facfe", "#00f2fe"]}
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
      colors={["#4facfe", "#00f2fe"]}
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
              <MaterialIcons name="person-add" size={48} color="#4facfe" />
            </Surface>
            <Title style={commonStyles.appTitle}>Join EduPlanner</Title>
            <Text style={commonStyles.subtitle}>
              Start your personalized learning journey
            </Text>
          </Animatable.View>

          {/* Signup Form */}
          <Animatable.View animation="fadeInUp" duration={1000} delay={300}>
            <Card style={commonStyles.card} elevation={5}>
              <Card.Content style={commonStyles.cardContent}>
                <Title style={commonStyles.title}>Create Your Account</Title>
                <Text style={commonStyles.description}>
                  Join thousands of students achieving their goals
                </Text>

                {/* Name Input */}
                <View style={commonStyles.inputContainer}>
                  <TextInput
                    label="Full Name"
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      if (nameError) setNameError("");
                    }}
                    autoCapitalize="words"
                    autoComplete="name"
                    style={commonStyles.input}
                    mode="outlined"
                    error={!!nameError}
                    left={<TextInput.Icon icon="account" />}
                    theme={{
                      colors: {
                        primary: "#4facfe",
                        outline: nameError ? "#ef4444" : "#d1d5db",
                      },
                    }}
                  />
                  {nameError ? (
                    <HelperText type="error" visible={!!nameError}>
                      {nameError}
                    </HelperText>
                  ) : null}
                </View>

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
                        primary: "#4facfe",
                        outline: emailError ? "#ef4444" : "#d1d5db",
                      },
                    }}
                  />
                  {emailError ? (
                    <HelperText type="error" visible={!!emailError}>
                      {emailError}
                    </HelperText>
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
                    autoComplete="password-new"
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
                        primary: "#4facfe",
                        outline: passwordError ? "#ef4444" : "#d1d5db",
                      },
                    }}
                  />
                  {passwordError ? (
                    <HelperText type="error" visible={!!passwordError}>
                      {passwordError}
                    </HelperText>
                  ) : null}
                </View>

                {/* Confirm Password Input */}
                <View style={commonStyles.inputContainer}>
                  <TextInput
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (confirmPasswordError) setConfirmPasswordError("");
                    }}
                    secureTextEntry={!showConfirmPassword}
                    style={commonStyles.input}
                    mode="outlined"
                    error={!!confirmPasswordError}
                    left={<TextInput.Icon icon="lock-check" />}
                    right={
                      <TextInput.Icon
                        icon={showConfirmPassword ? "eye-off" : "eye"}
                        onPress={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      />
                    }
                    theme={{
                      colors: {
                        primary: "#4facfe",
                        outline: confirmPasswordError ? "#ef4444" : "#d1d5db",
                      },
                    }}
                  />
                  {confirmPasswordError ? (
                    <HelperText type="error" visible={!!confirmPasswordError}>
                      {confirmPasswordError}
                    </HelperText>
                  ) : null}
                </View>

                {/* Terms and Conditions */}
                <Text style={styles.termsText}>
                  By creating an account, you agree to our{" "}
                  <Text style={styles.linkText}>Terms of Service</Text> and{" "}
                  <Text style={styles.linkText}>Privacy Policy</Text>
                </Text>

                {/* Signup Button */}
                <Animatable.View
                  animation="pulse"
                  iterationCount={loading ? "infinite" : 1}
                >
                  <Button
                    mode="contained"
                    onPress={handleSignup}
                    style={styles.signupButton}
                    contentStyle={styles.signupButtonContent}
                    loading={loading}
                    disabled={loading}
                    icon={loading ? undefined : "account-plus"}
                    buttonColor="#4facfe"
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </Button>
                </Animatable.View>

                {/* Login Link */}
                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>Already have an account?</Text>
                  <Button
                    mode="text"
                    onPress={() => router.push("/login")}
                    labelStyle={commonStyles.loginButtonText}
                    compact
                    disabled={loading}
                  >
                    Sign In
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
          {
            backgroundColor: snackbarMessage.includes("successfully")
              ? "#10b981"
              : "#ef4444",
          },
        ]}
      >
        {snackbarMessage}
      </Snackbar>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  termsText: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 18,
  },
  linkText: {
    color: "#4facfe",
    fontWeight: "600",
  },
  signupButton: {
    borderRadius: 12,
    marginBottom: 24,
  },
  signupButtonContent: {
    paddingVertical: 8,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    color: "#6b7280",
    fontSize: 16,
  },
});
