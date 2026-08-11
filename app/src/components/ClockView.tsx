/**
 * KONUM: app/src/components/ClockView.tsx   (yeni dosya)
 *
 * Bir tarafın saati. Kendi zamanlayıcısını kendi çalıştırıyor — bu yüzden
 * saniyeler geçerken sadece BU bileşen yeniden çiziliyor, oyun ekranı değil.
 *
 * Tasarımı değiştirmek isteyince buraya bak; Adım 6'nın sonunda saatler
 * tahtanın üstüne ve altına taşınacak.
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { formatClock, type Clock } from '../game/clock';
import type { Side } from '../chess/engine';

const LOW_MS = 10_000;

type Props = {
  clock: Clock;
  side: Side;
  label: string;
};

export default function ClockView({ clock, side, label }: Props) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!clock.enabled) return;
    const id = setInterval(() => setTick(t => t + 1), 100);
    return () => clearInterval(id);
  }, [clock]);

  if (!clock.enabled) return null;

  const ms = clock.remaining(side);
  const active = clock.active() === side;
  const low = ms < LOW_MS;

  return (
    <View style={[styles.row, active && styles.rowActive]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.time, active && styles.timeActive, low && styles.timeLow]}>
        {formatClock(ms)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.button,
    borderColor: theme.panelEdge,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  rowActive: { borderColor: theme.warn },
  label: { color: theme.textDim, fontSize: 13 },
  time: {
    color: theme.textDim,
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'], // rakamlar eşit genişlikte, sayı zıplamaz
  },
  timeActive: { color: theme.text },
  timeLow: { color: '#D9503F' },
});
