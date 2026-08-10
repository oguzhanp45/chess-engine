/**
 * KONUM: app/src/navigation/RootTabs.tsx   (üzerine yaz)
 *
 * Değişiklik: "Oyna" sekmesi artık doğrudan tahtayı değil, PlayStack'i açıyor
 * (kurulum ekranı → oyun ekranı).
 */

import React from 'react';
import { StyleSheet, Text, useWindowDimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import PlayStack from './PlayStack';
import PuzzlesScreen from '../screens/PuzzlesScreen';
import LearnScreen from '../screens/LearnScreen';
import MoreScreen from '../screens/MoreScreen';
import { theme } from '../theme';

const Tab = createBottomTabNavigator();

function icon(symbol: string) {
  return ({ color }: { color: string }) => (
    <Text style={[styles.icon, { color }]}>{symbol}</Text>
  );
}

export default function RootTabs() {
  const { width, height } = useWindowDimensions();
  const wide = width > height && width >= 700;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarPosition: wide ? 'left' : 'bottom',
        tabBarActiveTintColor: theme.warn,
        tabBarInactiveTintColor: theme.textDim,
        tabBarStyle: {
          backgroundColor: theme.panel,
          borderTopColor: theme.panelEdge,
          borderRightColor: theme.panelEdge,
          width: wide ? 92 : undefined,
        },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Ana Sayfa', tabBarIcon: icon('\u2302') }}
      />
      <Tab.Screen
        name="Play"
        component={PlayStack}
        options={{ tabBarLabel: 'Oyna', tabBarIcon: icon('\u265F') }}
      />
      <Tab.Screen
        name="Puzzles"
        component={PuzzlesScreen}
        options={{ tabBarLabel: 'Bulmacalar', tabBarIcon: icon('\u25C8') }}
      />
      <Tab.Screen
        name="Learn"
        component={LearnScreen}
        options={{ tabBarLabel: 'Öğren', tabBarIcon: icon('\u2632') }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{ tabBarLabel: 'Daha Fazla', tabBarIcon: icon('\u22EF') }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  icon: { fontSize: 20, lineHeight: 24 },
});
