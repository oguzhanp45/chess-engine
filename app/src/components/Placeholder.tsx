/**
 * KONUM: app/src/components/Placeholder.tsx   (yeni dosya)
 *
 * Henüz yazılmamış ekranlar için ortak iskelet. Boş beyaz ekran yerine
 * "burada ne olacak" yazması, iskeleti gezerken neyin eksik olduğunu
 * görmeni sağlıyor. Ekran gerçek içeriğini alınca bu bileşen kaldırılır.
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

type Props = {
  title: string;
  step: string;      // hangi adımda yapılacak
  items: string[];   // buraya gelecek özellikler
};

export default function Placeholder({ title, step, items }: Props) {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.step}>{step}</Text>

      <View style={styles.card}>
        {items.map(item => (
          <Text key={item} style={styles.item}>
            •  {item}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  content: { padding: theme.gap * 2, gap: theme.gap },
  title: { color: theme.text, fontSize: 28, fontWeight: '700' },
  step: { color: theme.warn, fontSize: 13 },
  card: {
    backgroundColor: theme.panel,
    borderColor: theme.panelEdge,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: theme.gap,
    gap: 6,
    marginTop: theme.gap,
  },
  item: { color: theme.textDim, fontSize: 15, lineHeight: 22 },
});
