import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useAtomValue } from 'jotai';
import { tokenAtom } from '@/store/authStore';
import { testAPIEndpoints, getWorkingEndpoints, getMissingEndpoints } from '@/utils/apiHealthCheck';
import COLORS from '@/constants/color';

export default function APIHealthCheck() {
  const [results, setResults] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const token = useAtomValue(tokenAtom);

  const runHealthCheck = async () => {
    setTesting(true);
    try {
      const testResults = await testAPIEndpoints(token || undefined);
      setResults(testResults);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setTesting(false);
    }
  };

  const getStatusColor = (result: any) => {
    if (!result.available) return '#FF3B30';
    if (result.status === 200) return '#34C759';
    if (result.status < 400) return '#FF9500';
    return '#FF3B30';
  };

  const getStatusText = (result: any) => {
    if (!result.available) return `ERROR: ${result.error || 'Not available'}`;
    return `Status: ${result.status}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Health Check</Text>
      
      <TouchableOpacity 
        style={[styles.button, testing && styles.buttonDisabled]} 
        onPress={runHealthCheck}
        disabled={testing}
      >
        <Text style={styles.buttonText}>
          {testing ? 'Testing...' : 'Run Health Check'}
        </Text>
      </TouchableOpacity>

      {results && (
        <ScrollView style={styles.resultsContainer}>
          <Text style={styles.sectionTitle}>
            Working: {getWorkingEndpoints(results).length} | 
            Missing: {getMissingEndpoints(results).length}
          </Text>
          
          {Object.entries(results).map(([name, result]: [string, any]) => (
            <View key={name} style={styles.resultItem}>
              <Text style={styles.endpointName}>{name}</Text>
              <Text style={[styles.status, { color: getStatusColor(result) }]}>
                {getStatusText(result)}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 15,
    textAlign: 'center',
  },
  resultItem: {
    backgroundColor: COLORS.cardBackground,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  endpointName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 5,
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
  },
});