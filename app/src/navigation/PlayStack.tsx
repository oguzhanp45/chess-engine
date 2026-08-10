/**
 * KONUM: app/src/navigation/PlayStack.tsx   (yeni dosya)
 *
 * "Oyna" sekmesinin içindeki yığın. Yığın = üst üste binen ekranlar;
 * geri gidince üstteki kalkar. Kurulum altta, oyun üstünde.
 *
 * headerShown: oyun ekranında başlık çubuğu var ki geri düğmesi olsun,
 * kurulum ekranında yok (sekme adı zaten "Oyna").
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import NewGameScreen from '../screens/NewGameScreen';
import PlayScreen from '../screens/PlayScreen';
import { theme } from '../theme';
import type { PlayStackParamList } from './types';

const Stack = createNativeStackNavigator<PlayStackParamList>();

export default function PlayStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.panel },
        headerTintColor: theme.text,
        contentStyle: { backgroundColor: theme.bg },
      }}
    >
      <Stack.Screen
        name="NewGame"
        component={NewGameScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Game"
        component={PlayScreen}
        options={{ title: 'Oyun' }}
      />
    </Stack.Navigator>
  );
}
