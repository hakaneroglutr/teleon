import React from 'react';
import {StatusBar} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import AppNavigator from './src/navigation/AppNavigator';
import {Colors} from './src/theme/colors';
import {useAppInit} from './src/hooks/useAppInit';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {retry: 2, staleTime: 1000 * 60 * 5, gcTime: 1000 * 60 * 60},
  },
});

function AppContent() {
  useAppInit();
  return <AppNavigator />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar barStyle="light-content" backgroundColor={Colors.background} translucent={false} />
          <AppContent />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
