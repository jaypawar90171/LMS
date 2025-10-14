import { Stack } from "expo-router";
import COLORS from "@/constants/color";

export default function ExploreLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Explore Library",
        }}
      />
      <Stack.Screen
        name="category-details"
        options={{
          title: "Category",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="items-list"
        options={{
          title: "Items",
          headerBackTitle: "Back",
        }}
      />
    </Stack>
  );
}
