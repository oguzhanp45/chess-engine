/**
 * KONUM: app/src/components/PromotionDialog.tsx   (üzerine yaz)
 */

import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import PieceView from './PieceView';
import { theme } from '../theme';
import { t, useLanguage } from '../i18n';
import type { Piece } from '../chess/fen';
import type { Side } from '../chess/engine';

const CHOICES: { code: 'q' | 'r' | 'b' | 'n'; key: string }[] = [
  { code: 'q', key: 'promotion.queen' },
  { code: 'r', key: 'promotion.rook' },
  { code: 'b', key: 'promotion.bishop' },
  { code: 'n', key: 'promotion.knight' },
];

type Props = {
  visible: boolean;
  side: Side;
  size: number;
  onPick: (code: 'q' | 'r' | 'b' | 'n') => void;
  onCancel: () => void;
};

export default function PromotionDialog({
  visible, side, size, onPick, onCancel,
}: Props) {
  useLanguage();
  const pieceSize = Math.max(44, Math.min(72, size));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{t('promotion.title')}</Text>

          <View style={styles.row}>
            {CHOICES.map(choice => {
              const letter = (
                side === 'w' ? choice.code.toUpperCase() : choice.code
              ) as Piece;
              return (
                <Pressable
                  key={choice.code}
                  onPress={() => onPick(choice.code)}
                  style={({ pressed }) => [styles.option, pressed && styles.pressed]}
                >
                  <PieceView piece={letter} size={pieceSize} />
                  <Text style={styles.label}>{t(choice.key)}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.hint}>{t('promotion.hint')}</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.gap,
  },
  card: {
    backgroundColor: theme.panel,
    borderColor: theme.panelEdge,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: theme.gap * 1.5,
    gap: theme.gap,
    alignItems: 'center',
  },
  title: { color: theme.text, fontSize: 18, fontWeight: '700' },
  row: { flexDirection: 'row', gap: theme.gap },
  option: {
    alignItems: 'center',
    gap: 4,
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.board.light,
  },
  pressed: { opacity: 0.6 },
  label: { color: '#1A1A1A', fontSize: 12, fontWeight: '600' },
  hint: { color: theme.textDim, fontSize: 11 },
});
