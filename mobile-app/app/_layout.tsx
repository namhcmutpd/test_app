import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { initializeAuth } from '../services/api';
import { Colors } from '../constants/Colors';

// Global state để các component khác có thể check
let isUserAuthenticated = false;

export const getIsAuthenticated = () => isUserAuthenticated;

export const setIsAuthenticated = (value: boolean) => {
  isUserAuthenticated = value;
};

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const hasToken = await initializeAuth();
        isUserAuthenticated = hasToken;
      } finally {
        setIsReady(true);
      }
    };

    bootstrapAuth();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral.background,
  },
});
