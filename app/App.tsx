/**
 * Uygulama kökü. Adım 6'da burası sekmeli navigasyona dönüşecek
 * (Oyna / Bulmaca / Öğren / Profil).
 */

import React from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import PlayScreen from './src/screens/PlayScreen';
import { theme } from './src/theme';

export default function App() {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={theme.bg} />
      <PlayScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  },
});
