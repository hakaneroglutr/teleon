// src/navigation/AppNavigator.tsx
import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {RootStackParamList, TabParamList} from './types';
import {Colors} from '@theme/colors';

// ── Screens ───────────────────────────────────────────────────────────────────
import SplashScreen        from '@screens/SplashScreen';
import HomeScreen          from '@screens/HomeScreen';
import LiveTVScreen        from '@screens/LiveTVScreen';
import MoviesScreen        from '@screens/MoviesScreen';
import SeriesScreen        from '@screens/SeriesScreen';
import EPGScreen           from '@screens/EPGScreen';
import FavoritesScreen     from '@screens/FavoritesScreen';
import SettingsScreen      from '@screens/SettingsScreen';
import PlayerScreen        from '@screens/PlayerScreen';
import AddServerScreen     from '@screens/AddServerScreen';
import SearchScreen        from '@screens/SearchScreen';
import VodDetailScreen     from '@screens/VodDetailScreen';
import SeriesDetailScreen  from '@screens/SeriesDetailScreen';
import MultiScreenScreen   from '@screens/MultiScreenScreen';
import CatchupScreen       from '@screens/CatchupScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab   = createBottomTabNavigator<TabParamList>();

// ── Tab icon ──────────────────────────────────────────────────────────────────
function TabIcon({focused, color, emoji, label}: {focused: boolean; color: string; emoji: string; label: string}) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, {color}]}>{label}</Text>
    </View>
  );
}

// ── Bottom Tabs ───────────────────────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown:          false,
        tabBarStyle:          styles.tabBar,
        tabBarActiveTintColor:   Colors.accent,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarShowLabel:      false,
      }}>
      <Tab.Screen name="Home"      component={HomeScreen}      options={{tabBarIcon: (p) => <TabIcon {...p} emoji="🏠" label="Ana Sayfa" />}} />
      <Tab.Screen name="LiveTV"    component={LiveTVScreen}    options={{tabBarIcon: (p) => <TabIcon {...p} emoji="📺" label="Canlı TV"  />}} />
      <Tab.Screen name="Movies"    component={MoviesScreen}    options={{tabBarIcon: (p) => <TabIcon {...p} emoji="🎬" label="Filmler"   />}} />
      <Tab.Screen name="Series"    component={SeriesScreen}    options={{tabBarIcon: (p) => <TabIcon {...p} emoji="🎭" label="Diziler"   />}} />
      <Tab.Screen name="EPG"       component={EPGScreen}       options={{tabBarIcon: (p) => <TabIcon {...p} emoji="📅" label="Rehber"    />}} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{tabBarIcon: (p) => <TabIcon {...p} emoji="⭐"  label="Favoriler" />}} />
      <Tab.Screen name="Settings"  component={SettingsScreen}  options={{tabBarIcon: (p) => <TabIcon {...p} emoji="⚙️" label="Ayarlar"   />}} />
    </Tab.Navigator>
  );
}

// ── Root Stack ────────────────────────────────────────────────────────────────
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{headerShown: false}}>
        <Stack.Screen name="Splash"       component={SplashScreen} />
        <Stack.Screen name="Main"         component={MainTabs} />
        <Stack.Screen
          name="Player"
          component={PlayerScreen}
          options={{presentation: 'fullScreenModal', gestureEnabled: false}}
        />
        <Stack.Screen
          name="MultiScreen"
          component={MultiScreenScreen}
          options={{presentation: 'fullScreenModal', gestureEnabled: false}}
        />
        <Stack.Screen name="AddServer"     component={AddServerScreen}    options={{presentation: 'modal'}} />
        <Stack.Screen name="Search"        component={SearchScreen} />
        <Stack.Screen name="VodDetail"     component={VodDetailScreen} />
        <Stack.Screen name="SeriesDetail"  component={SeriesDetailScreen} />
        <Stack.Screen name="Catchup"       component={CatchupScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar:        {backgroundColor: Colors.tabBackground, borderTopColor: Colors.surfaceBorder, borderTopWidth: 1, height: 64, paddingBottom: 8, paddingTop: 6},
  tabIcon:       {alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2},
  tabIconActive: {},
  tabEmoji:      {fontSize: 18, lineHeight: 22},
  tabLabel:      {fontSize: 9, fontWeight: '500', marginTop: 1, letterSpacing: 0.2},
});
