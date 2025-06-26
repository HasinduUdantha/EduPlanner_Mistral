import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerStyle: {
          backgroundColor: '#6366f1', // Consistent with app theme
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
        },
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: 'Welcome to EduPlanner',
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          title: 'Create Your Account',
        }}
      />
    </Stack>
  );
}
