/**
 * KONUM: app/src/components/GameOverDialog.tsx   (üzerine yaz)
 */

import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { t, useLanguage } from '../i18n';

type Props = {
  visible: boolean;
  title: string;   // zaten çevrilmiş halde gelir
  score: string;   // '1-0' gibi, dilden bağımsız
  onRematch: () => void;
  onMenu: () => void;
  onClose: () => void;
};

export default function GameOverDialog({
  visible, title, score, onRematch, onMenu, onClose,
}: Props) {
  useLanguage();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          {score !== '' && <Text style={styles.score}>{score}</Text>}
          <Text style={styles.title}>{title}</Text>

          <View style={styles.buttons}>
            <Pressable
              onPress={onRematch}
              style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
            >
              <Text style={styles.primaryText}>{t('gameOver.rematch')}</Text>
            </Pressable>

            <Pressable
              onPress={onMenu}
              style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryText}>{t('common.menu')}</Text>
            </Pressable>
          </View>

          <View style={[styles.secondary, styles.disabled]}>
            <Text style={styles.secondaryText}>
              {t('gameOver.analyze')} ({t('common.soon')})
            </Text>
          </View>

          <Text style={styles.hint}>{t('gameOver.hint')}</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
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
    minWidth: 280,
  },
  score: { color: theme.warn, fontSize: 32, fontWeight: '700', letterSpacing: 2 },
  title: { color: theme.text, fontSize: 17, textAlign: 'center' },
  buttons: { flexDirection: 'row', gap: 8 },
  primary: {
    backgroundColor: theme.warn,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  primaryText: { color: '#1A1A1A', fontSize: 15, fontWeight: '700' },
  secondary: {
    backgroundColor: theme.button,
    borderColor: theme.panelEdge,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  secondaryText: { color: theme.text, fontSize: 15, fontWeight: '600' },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.6 },
  hint: { color: theme.textDim, fontSize: 11 },
});
