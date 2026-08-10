/**
 * KONUM: app/src/screens/NewGameScreen.tsx   (yeni dosya)
 *
 * Oyun kurulum ekranı. Seçimler burada toplanır, "Başlat" ile oyun ekranına
 * parametre olarak geçer. Oyun ekranı kendi başına hiçbir varsayılan üretmez —
 * ne oynanacağını tek yerden okuyoruz.
 */

import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { theme } from '../theme';
import {
  DEFAULT_SETTINGS,
  LEVEL_PRESETS,
  TIME_PRESETS,
  timeLabel,
  type ColorChoice,
  type GameMode,
  type TimeControl,
} from '../game/types';
import type { PlayStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<PlayStackParamList, 'NewGame'>;

export default function NewGameScreen({ navigation }: Props) {
  const [mode, setMode] = useState<GameMode>(DEFAULT_SETTINGS.mode);
  const [color, setColor] = useState<ColorChoice>(DEFAULT_SETTINGS.color);
  const [level, setLevel] = useState(DEFAULT_SETTINGS.level);
  const [time, setTime] = useState<TimeControl>(DEFAULT_SETTINGS.time);

  // Özel süre alanları metin olarak tutuluyor; sayıya çevirmeyi başlatırken yapıyoruz.
  const [customMin, setCustomMin] = useState('10');
  const [customInc, setCustomInc] = useState('5');

  const applyCustomTime = () => {
    const min = Number(customMin);
    const inc = Number(customInc);
    if (!Number.isFinite(min) || min <= 0) return;
    setTime({
      initialMs: Math.round(min * 60_000),
      incrementMs: Math.round((Number.isFinite(inc) ? inc : 0) * 1000),
    });
  };

  const start = () => {
    navigation.navigate('Game', {
      settings: { mode, color, level, time },
    });
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Section title="Mod">
        <Chip label="Yapay Zeka" active={mode === 'ai'} onPress={() => setMode('ai')} />
        <Chip label="Yerel 1v1" active={mode === 'local'} onPress={() => setMode('local')} />
        <Chip label="Eğitmen (Adım 11)" active={false} disabled onPress={() => {}} />
      </Section>

      {mode !== 'local' && (
        <>
          <Section title="Rengin">
            <Chip label="Beyaz" active={color === 'w'} onPress={() => setColor('w')} />
            <Chip label="Siyah" active={color === 'b'} onPress={() => setColor('b')} />
            <Chip label="Rastgele" active={color === 'random'} onPress={() => setColor('random')} />
          </Section>

          <Section title="Zorluk">
            {LEVEL_PRESETS.map(p => (
              <Chip
                key={p.level}
                label={p.label}
                active={level === p.level}
                onPress={() => setLevel(p.level)}
              />
            ))}
          </Section>
        </>
      )}

      <Section title="Süre">
        {TIME_PRESETS.map(p => (
          <Chip
            key={p.label}
            label={p.label}
            active={timeLabel(time) === p.label}
            onPress={() => setTime(p.time)}
          />
        ))}
      </Section>

      <View style={styles.customRow}>
        <Text style={styles.customLabel}>Özel:</Text>
        <TextInput
          style={styles.input}
          value={customMin}
          onChangeText={setCustomMin}
          keyboardType="number-pad"
          maxLength={3}
        />
        <Text style={styles.customLabel}>dk  +</Text>
        <TextInput
          style={styles.input}
          value={customInc}
          onChangeText={setCustomInc}
          keyboardType="number-pad"
          maxLength={2}
        />
        <Text style={styles.customLabel}>sn/hamle</Text>
        <Chip label="Uygula" active={false} onPress={applyCustomTime} />
      </View>

      <Text style={styles.summary}>
        {mode === 'local' ? 'Yerel 1v1' : 'Yapay Zeka'} · {timeLabel(time)}
        {mode !== 'local' &&
          ` · ${LEVEL_PRESETS.find(p => p.level === level)?.label ?? level}`}
      </Text>

      <Pressable
        onPress={start}
        style={({ pressed }) => [styles.start, pressed && styles.pressed]}
      >
        <Text style={styles.startText}>Oyunu Başlat</Text>
      </Pressable>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

function Chip({
  label, active, disabled = false, onPress,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        disabled && styles.chipDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  content: { padding: theme.gap * 1.5, gap: theme.gap, paddingBottom: theme.gap * 3 },
  section: { gap: 8 },
  sectionTitle: {
    color: theme.textDim,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: theme.button,
    borderColor: theme.panelEdge,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  chipActive: { backgroundColor: theme.warn, borderColor: theme.warn },
  chipDisabled: { opacity: 0.4 },
  chipText: { color: theme.text, fontSize: 14 },
  chipTextActive: { color: '#1A1A1A', fontWeight: '700' },
  pressed: { opacity: 0.6 },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  customLabel: { color: theme.textDim, fontSize: 13 },
  input: {
    backgroundColor: theme.panel,
    borderColor: theme.panelEdge,
    borderWidth: 1,
    borderRadius: 8,
    color: theme.text,
    paddingVertical: 6,
    paddingHorizontal: 12,
    minWidth: 56,
    textAlign: 'center',
  },
  summary: { color: theme.textDim, fontSize: 14, marginTop: theme.gap },
  start: {
    backgroundColor: theme.warn,
    borderRadius: theme.radius,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startText: { color: '#1A1A1A', fontSize: 17, fontWeight: '700' },
});
