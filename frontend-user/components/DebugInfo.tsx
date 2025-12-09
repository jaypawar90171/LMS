import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAtomValue } from 'jotai';
import { isCheckingAuthAtom, isAuthenticatedAtom, tokenAtom, userAtom } from '@/store/authStore';
import { useSegments } from 'expo-router';
import COLORS from '@/constants/color';

export default function DebugInfo() {
  const isChecking = useAtomValue(isCheckingAuthAtom);
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const token = useAtomValue(tokenAtom);
  const user = useAtomValue(userAtom);
  const segments = useSegments();

  if (__DEV__) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Debug Info</Text>
        <Text style={styles.text}>Checking Auth: {isChecking ? 'Yes' : 'No'}</Text>
        <Text style={styles.text}>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</Text>
        <Text style={styles.text}>Token: {token ? 'Present' : 'None'}</Text>
        <Text style={styles.text}>User: {user ? 'Present' : 'None'}</Text>
        <Text style={styles.text}>Segments: {JSON.stringify(segments)}</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    borderRadius: 5,
    zIndex: 1000,
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  text: {
    color: 'white',
    fontSize: 12,
  },
});