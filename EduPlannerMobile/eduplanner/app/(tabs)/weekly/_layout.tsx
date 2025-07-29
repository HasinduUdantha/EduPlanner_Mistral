import { Stack } from "expo-router";

export default function WeeklyLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide the header if not needed
        animation: "slide_from_right", // Slide animation for navigation
      }}
    >
      <Stack.Screen name="index" /> {/* Weekly Study Plan */}
      <Stack.Screen name="details" /> {/* Details View */}
    </Stack>
  );
}
