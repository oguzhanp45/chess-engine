/**
 * Oyun ekranı. Tüm state burada; Board ve Square hiçbir şey saklamaz.
 *
 * Akış tek yönlü:
 *   dokunuş -> engine.makeMove() -> readSnapshot() -> setState -> çizim
 *
 * Ekran pozisyonu kendi başına hesaplamaz. Motor tek doğru kaynaktır;
 * aksi halde C++ ile JS pozisyonları sessizce ayrışır.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Board from '../components/Board';
import { theme } from '../theme';
import { createEngine, ENGINE_IS_MOCK } from '../chess/createEngine';
import { readSnapshot, type ChessEngine, type Snapshot } from '../chess/engine';
import { START_FEN, fenToBoard, squareToIndex } from '../chess/fen';
import { nativeVersion } from '../native/nativeInfo';

const EMPTY: Snapshot = {
  fen: START_FEN,
  sideToMove: 'w',
  legalMoves: [],
  historySan: [],
  status: 'ongoing',
};

export default function PlayScreen() {
  const { width, height } = useWindowDimensions();

  // Motor nesnesi render'lar arasında aynı kalmalı.
  const engineRef = useRef<ChessEngine | null>(null);
  if (engineRef.current === null) engineRef.current = createEngine();
  const engine = engineRef.current;

  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY);
  const [selected, setSelected] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [bridge] = useState(nativeVersion);

  const refresh = useCallback(async () => {
    setSnapshot(await readSnapshot(engine));
  }, [engine]);

  useEffect(() => {
    let alive = true;
    (async () => {
      await engine.newGame(START_FEN);
      const next = await readSnapshot(engine);
      if (alive) setSnapshot(next);
    })();
    // Bileşen kaldırılırsa geç gelen cevabı yok say.
    return () => { alive = false; };
  }, [engine]);

  const newGame = useCallback(async () => {
    setSelected(null);
    setLastMove(null);
    await engine.newGame(START_FEN);
    await refresh();
  }, [engine, refresh]);

  const undo = useCallback(async () => {
    setSelected(null);
    setLastMove(null);
    if (await engine.undo()) await refresh();
  }, [engine, refresh]);

  const onSquarePress = useCallback(
    async (square: string) => {
      if (busy) return;

      const board = fenToBoard(snapshot.fen);
      const piece = board[squareToIndex(square)];

      if (selected === null) {
        if (piece !== null) setSelected(square);
        return;
      }
      if (selected === square) {
        setSelected(null);
        return;
      }

      // TODO Adım 6: piyon son sıraya varıyorsa terfi harfi eklenecek ('e7e8q').
      const uci = selected + square;

      setBusy(true);
      try {
        if (await engine.makeMove(uci)) {
          setLastMove({ from: selected, to: square });
          setSelected(null);
          await refresh();
        } else {
          setSelected(piece !== null ? square : null);
        }
      } finally {
        setBusy(false);
      }
    },
    [busy, engine, refresh, selected, snapshot.fen],
  );

  const isLandscape = width > height;
  const pad = theme.gap;
  const boardSize = Math.floor(
    isLandscape
      ? Math.min(height - pad * 2, (width - pad * 3) * 0.62)
      : Math.min(width - pad * 2, (height - pad * 2) * 0.68),
  );

  return (
    <View style={[styles.root, isLandscape ? styles.rowLayout : styles.colLayout]}>
      <Board
        fen={snapshot.fen}
        size={boardSize}
        selected={selected}
        legalMoves={snapshot.legalMoves}
        lastMove={lastMove}
        flipped={flipped}
        onSquarePress={onSquarePress}
      />

      <View style={[styles.panel, isLandscape ? styles.panelSide : styles.panelBottom]}>
        {ENGINE_IS_MOCK && (
          <Text style={styles.badge}>Sahte motor — kural denetimi yok (Adım 3)</Text>
        )}

        <Text style={styles.dim}>Köprü: {bridge}</Text>

        <Text style={styles.turn}>
          Sıra: {snapshot.sideToMove === 'w' ? 'Beyaz' : 'Siyah'}
        </Text>
        <Text style={styles.dim}>Durum: {snapshot.status}</Text>

        <View style={styles.buttons}>
          <Button label="Yeni oyun" onPress={newGame} />
          <Button label="Geri al" onPress={undo} />
          <Button label="Çevir" onPress={() => setFlipped(f => !f)} />
        </View>

        <Text style={styles.section}>Hamleler</Text>
        <ScrollView style={styles.historyBox}>
          <Text style={styles.historyText}>
            {snapshot.historySan.length > 0
              ? formatHistory(snapshot.historySan)
              : 'Henüz hamle yok.'}
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}

/** ['e2e4','e7e5'] -> '1. e2e4 e7e5' */
function formatHistory(moves: string[]): string {
  const lines: string[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    const no = i / 2 + 1;
    lines.push(`${no}. ${moves[i]}${moves[i + 1] ? ' ' + moves[i + 1] : ''}`);
  }
  return lines.join('   ');
}

function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.gap,
    gap: theme.gap,
  },
  colLayout: { flexDirection: 'column' },
  rowLayout: { flexDirection: 'row' },
  panel: {
    backgroundColor: theme.panel,
    borderColor: theme.panelEdge,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: theme.gap,
    gap: 8,
  },
  panelBottom: { alignSelf: 'stretch', flexShrink: 1 },
  panelSide: { flex: 1, maxWidth: 340, alignSelf: 'stretch' },
  badge: { color: theme.warn, fontSize: 12 },
  turn: { color: theme.text, fontSize: 20, fontWeight: '700' },
  dim: { color: theme.textDim, fontSize: 13 },
  section: {
    color: theme.textDim,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  button: {
    backgroundColor: theme.button,
    borderColor: theme.panelEdge,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  buttonPressed: { opacity: 0.6 },
  buttonText: { color: theme.text, fontSize: 14, fontWeight: '600' },
  historyBox: { maxHeight: 140 },
  historyText: { color: theme.textDim, fontSize: 14, lineHeight: 22 },
});
