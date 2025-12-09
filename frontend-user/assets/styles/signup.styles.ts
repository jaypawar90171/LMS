import { StyleSheet } from "react-native";

export default function createDynamicStyles(colors: any) {
  return StyleSheet.create({
    scrollViewStyle: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollViewContent: {
      flexGrow: 1,
      paddingBottom: 30,
    },
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: colors.background,
    },

    // ILLUSTRATION
    topIllustration: {
      alignItems: "center",
      marginBottom: 20,
      marginTop: 20,
    },
    illustrationImage: {
      width: 180,
      height: 180,
    },

    // CARD
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 20,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
      width: "100%",
    },

    // HEADERS
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 6,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 20,
    },

    // FORM INPUTS
    formContainer: {
      width: "100%",
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 6,
    },

    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      minHeight: 52,
    },

    inputIcon: {
      marginRight: 8,
    },

    input: {
      flex: 1,
      fontSize: 15,
      color: colors.textPrimary,
      paddingVertical: 10,
    },

    eyeIcon: {
      paddingHorizontal: 6,
    },

    // -------- COUNTRY CODE + PHONE ----------
    phoneContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    codePicker: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: 110,
      paddingHorizontal: 12,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      height: 52,
    },
    codeText: {
      color: colors.textPrimary,
      fontSize: 15,
    },

    phoneInput: {
      flex: 1,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      height: 52,
      paddingHorizontal: 12,
      fontSize: 15,
      color: colors.textPrimary,
    },

    // -------- PICKER SELECT INPUTS ----------
    selectInput: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 52,
    },
    selectInputText: {
      fontSize: 15,
      color: colors.textPrimary,
    },

    // SECTION TITLE
    sectionTitle: {
      marginTop: 10,
      marginBottom: 6,
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700",
    },

    // BUTTON
    button: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
      flexDirection: "row",
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: "#FFF",
      fontSize: 16,
      fontWeight: "600",
    },

    // FOOTER
    backToLoginContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 18,
    },
    footerText: {
      color: colors.textSecondary,
      fontSize: 14,
      marginRight: 4,
    },
    link: {
      color: colors.primary,
      fontWeight: "700",
      fontSize: 14,
    },
  });
}
