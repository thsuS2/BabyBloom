import React, { useEffect } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from './src/store/authStore';
import { colors } from './src/design';

import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import HomeScreen from './src/screens/HomeScreen';
import LogScreen from './src/screens/LogScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    '홈': '🏠', '기록': '✏️', '캘린더': '📅', '커뮤니티': '💬',
  };
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>
      {icons[label] ?? '·'}
    </Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 85,
          paddingBottom: 20,
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen
        name="Home" component={HomeScreen}
        options={{ tabBarLabel: '홈', tabBarIcon: ({ focused }) => <TabIcon label="홈" focused={focused} /> }}
      />
      <Tab.Screen
        name="Log" component={LogScreen}
        options={{ tabBarLabel: '기록', tabBarIcon: ({ focused }) => <TabIcon label="기록" focused={focused} /> }}
      />
      <Tab.Screen
        name="Calendar" component={CalendarScreen}
        options={{ tabBarLabel: '캘린더', tabBarIcon: ({ focused }) => <TabIcon label="캘린더" focused={focused} /> }}
      />
      <Tab.Screen
        name="Community" component={CommunityScreen}
        options={{ tabBarLabel: '커뮤니티', tabBarIcon: ({ focused }) => <TabIcon label="커뮤니티" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const { user, loading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {user ? (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </Stack.Navigator>
        ) : (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
