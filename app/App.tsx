/**
 * KONUM: app/App.tsx   (üzerine yaz)
 *
 * Artık doğrudan bir ekran değil, gezinme ağacını kuruyor.
 *
 * SafeAreaProvider: çentik, durum çubuğu ve alt gezinme çubuğunun kapladığı
 * alanları hesaplar. Sekme çubuğu bunu kullanarak kendini doğru yere oturtur.
 *
 * NavigationContainer: gezinme durumunu (hangi sekmedeyiz, geri yığını)
 * tutan kap. Uygulamada bir tane olur.
 */

import React from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';

import RootTabs from './src/navigation/RootTabs';
import { theme } from './src/theme';

// React Navigation'ın kendi renk şeması; kendi paletimizle eşleştiriyoruz
// ki ekran geçişlerinde beyaz bir kare parlamasın.
const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: theme.bg,
    card: theme.panel,
    border: theme.panelEdge,
    text: theme.text,
    primary: theme.warn,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={theme.bg} />
        <NavigationContainer theme={navTheme}>
          <RootTabs />
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  },
});
