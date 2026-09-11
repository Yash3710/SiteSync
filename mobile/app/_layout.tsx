import React, { useEffect, useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from "expo-router";
import { RoleProvider, AuthContext } from "../lib/RoleContext";
import { I18nProvider } from "../lib/i18n";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useContext(AuthContext);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isAuthenticated === null) return;
    
    const inTabs = segments[0] === '(tabs)';
    const inLogin = segments[0] === 'login';

    if (isAuthenticated && inLogin) {
      router.replace('/(tabs)');
    } else if (isAuthenticated === false && !inLogin) {
      router.replace('/login');
    }
  }, [isAuthenticated, segments]);

  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <I18nProvider>
      <RoleProvider>
        <AuthGuard>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </AuthGuard>
      </RoleProvider>
    </I18nProvider>
  );
}
