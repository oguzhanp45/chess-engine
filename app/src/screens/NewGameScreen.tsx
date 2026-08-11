/**
 * KONUM: app/src/screens/NewGameScreen.tsx   (üzerine yaz)
 *
 * Tüm metinler sözlükten. useLanguage() dil değişiminde yenilenmeyi sağlıyor.
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
import { t, useLanguage } from '../i18n';
import { levelLabel } from '../game/labels';
import {
  DEFAULT_SETTINGS,
  LEVEL_VALUES,
  TIME_PRESETS,
  timeId,
  timeLabel,
  type ColorChoice,
  type GameMode,
  type TimeControl,
} from '../game/types';
import type { PlayStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<PlayStackParamList, 'NewGame'>;

export default function NewGameScreen({ navigation }: Props) {
  useLanguage();

  const [mode, setMode] = useState<GameMode>(DEFAULT_SETTINGS.mode);
  const [color, setColor] = useState<ColorChoice>(DEFAULT_SETTINGS.color);
  const [level, setLevel] = useState(DEFAULT_SETTINGS.level);
  const [time, setTime] = useState<TimeControl>(DEFAULT_SETTINGS.time);
  const [useBook, setUseBook] = useState(DEFAULT_SETTINGS.useBook);

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
    navigation.navigate('Game', { settings: { mode, color, level, time, useBook } });
  };

  const activeTimeId = timeId(time);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Section title={t('newGame.mode')}>
        <Chip label={t('newGame.ai')} active={mode === 'ai'} onPress={() => setMode('ai')} />
        <Chip label={t('newGame.local')} active={mode === 'local'} onPress={() => setMode('local')} />
        <Chip
          label={`${t('newGame.tutor')} (${t('common.soon')})`}
          active={false}
          disabled
          onPress={() => {}}
        />
      </Section>

      {mode !== 'local' && (
        <>
          <Section title={t('newGame.yourColor')}>
            <Chip label={t('common.white')} active={color === 'w'} onPress={() => setColor('w')} />
            <Chip label={t('common.black')} active={color === 'b'} onPress={() => setColor('b')} />
            <Chip label={t('common.random')} active={color === 'random'} onPress={() => setColor('random')} />
          </Section>

          <Section title={t('newGame.difficulty')}>
            {LEVEL_VALUES.map(value => (
              <Chip
                key={value}
                label={levelLabel(value)}
                active={level === value}
                onPress={() => setLevel(value)}
              />
            ))}
          </Section>
          
          <Section title={t('newGame.book')}>
            <Chip label={t('newGame.bookOn')} active={useBook} onPress={() => setUseBook(true)} />
            <Chip label={t('newGame.bookOff')} active={!useBook} onPress={() => setUseBook(false)} />
          </Section>
        </>
      )}

      <Section title={t('newGame.time')}>
        {TIME_PRESETS.map(preset => (
          <Chip
            key={preset.id}
            label={preset.id === 'unlimited' ? t('newGame.unlimited') : preset.id}
            active={activeTimeId === preset.id}
            onPress={() => setTime(preset.time)}
          />
        ))}
      </Section>

      <View style={styles.customRow}>
        <Text style={styles.customLabel}>{t('newGame.custom')}:</Text>
        <TextInput
          style={styles.input}
          value={customMin}
          onChangeText={setCustomMin}
          keyboardType="number-pad"
          maxLength={3}
        />
        <Text style={styles.customLabel}>{t('newGame.minutes')}  +</Text>
        <TextInput
          style={styles.input}
          value={customInc}
          onChangeText={setCustomInc}
          keyboardType="number-pad"
          maxLength={2}
        />
        <Text style={styles.customLabel}>{t('newGame.perMove')}</Text>
        <Chip label={t('common.apply')} active={false} onPress={applyCustomTime} />
      </View>

      <Text style={styles.summary}>
        {mode === 'local' ? t('newGame.local') : t('newGame.ai')} · {timeLabel(time)}
        {mode !== 'local' && ` · ${levelLabel(level)}`}
      </Text>

      <Pressable
        onPress={start}
        style={({ pressed }) => [styles.start, pressed && styles.pressed]}
      >
        <Text style={styles.startText}>{t('newGame.start')}</Text>
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
