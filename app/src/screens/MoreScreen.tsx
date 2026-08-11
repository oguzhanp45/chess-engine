/**
 * KONUM: app/src/screens/MoreScreen.tsx   (üzerine yaz)
 *
 * Artık tamamen boş değil: dil seçici burada. Ayarların geri kalanı
 * Adım 7'de (kalıcılık) ve Adım 14'te (temalar) gelecek.
 *
 * NOT: seçim şimdilik uygulamayı kapatınca unutuluyor. Adım 7'de
 * veritabanına yazılacak.
 */

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { formatNumber, getLanguage, setLanguage, t, tList, useLanguage, type Lang } from '../i18n';
import { getBookState } from '../native/book';



export default function MoreScreen() {
  const lang = useLanguage();
  const book = getBookState();

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('more.title')}</Text>
      
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
        <View style={styles.row}>
          <LangChip code="tr" label={t('settings.turkish')} active={lang === 'tr'} />
          <LangChip code="en" label={t('settings.english')} active={lang === 'en'} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('settings.book')}</Text>
        <Text style={styles.item}>
          {book.loaded
            ? t('settings.bookLoaded', { count: formatNumber(book.entries) })
            : t('settings.bookMissing', { reason: book.reason })}
        </Text>
      </View>

      <Text style={styles.step}>{t('more.step')}</Text>
      <View style={styles.card}>
        {tList('more.items').map(item => (
          <Text key={item} style={styles.item}>
            •  {item}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

function LangChip({
  code, label, active,
}: { code: Lang; label: string; active: boolean }) {
  return (
    <Pressable
      onPress={() => setLanguage(code)}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  content: { padding: theme.gap * 2, gap: theme.gap },
  title: { color: theme.text, fontSize: 28, fontWeight: '700' },
  step: { color: theme.warn, fontSize: 13, marginTop: theme.gap },
  card: {
    backgroundColor: theme.panel,
    borderColor: theme.panelEdge,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: theme.gap,
    gap: 8,
  },
  sectionTitle: {
    color: theme.textDim,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  row: { flexDirection: 'row', gap: 8 },
  chip: {
    backgroundColor: theme.button,
    borderColor: theme.panelEdge,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 18,
  },
  chipActive: { backgroundColor: theme.warn, borderColor: theme.warn },
  chipText: { color: theme.text, fontSize: 14 },
  chipTextActive: { color: '#1A1A1A', fontWeight: '700' },
  pressed: { opacity: 0.6 },
  item: { color: theme.textDim, fontSize: 15, lineHeight: 22 },
});
