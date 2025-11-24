import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import {useMemo} from 'react';

export default function SafeScreen({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
    const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

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
