import { useTheme } from "@/context/ThemeContext";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SafeScreen({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);

  return <View style={[dynamicStyles.container, { paddingTop: insets.top }]}>{children}</View>;
}

function createDynamicStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });
}