import { Stack } from "expo-router";
import COLORS from "@/constants/color";

export default function HomeStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: COLORS.cardBackground,
        },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: {
          fontWeight: "600",
        },
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Dashboard",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="issued-items"
        options={{
          title: "Issued Items",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="queued-items"
        options={{
          title: "Queued Items",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="new-arrivals"
        options={{
          title: "New Arrivals",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="item-details"
        options={{
          title: "Item Details",
          headerBackTitle: "Back",
        }}
      />
    </Stack>
  );
}
