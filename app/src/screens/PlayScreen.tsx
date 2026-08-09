/**
 * KONUM: app/src/screens/PlayScreen.tsx   (üzerine yaz)
 *
 * Artık gerçek motor bağlı. Değişenler:
 *  - readSnapshot yerine engine.snapshot() (tek köprü geçişi)
 *  - sadece geçerli hamlesi olan taş seçilebiliyor
 *  - terfi: iki dokunuş 'e7e8' verir, motor 'e7e8q' bekler; ekleniyor
 *  - oyun bitince hamle kabul edilmiyor
 *  - "Motor oynasın" düğmesi: bestMove testi. UYARI: arayüzü dondurur,
 *    Adım 4'ün varlık sebebi bu.
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
import { createEngine } from '../chess/createEngine';
import {
  EMPTY_SNAPSHOT,
  statusText,
  type ChessEngine,
  type Snapshot,
} from '../chess/engine';
import { fenToBoard, squareToIndex } from '../chess/fen';
import { nativeVersion } from '../native/nativeInfo';

const SEARCH_MS = 1000;

export default function PlayScreen() {
  const { width, height } = useWindowDimensions();

  const engineRef = useRef<ChessEngine | null>(null);
  if (engineRef.current === null) engineRef.current = createEngine();
  const engine = engineRef.current;

  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY_SNAPSHOT);
  const [selected, setSelected] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [bridge] = useState(nativeVersion);

  const refresh = useCallback(async () => {
    try {
      setSnapshot(await engine.snapshot());
    } catch (e) {
      setNote(`HATA snapshot: ${String(e)}`);
    }
  }, [engine]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await engine.newGame('');
        const next = await engine.snapshot();
        if (alive) setSnapshot(next);
      } catch (e) {
        if (alive) setNote(`HATA baslangic: ${String(e)}`);
      }
    })();
    return () => { alive = false; };
  }, [engine]);

  const newGame = useCallback(async () => {
    setSelected(null);
    setLastMove(null);
    setNote('');
    await engine.newGame('');
    await refresh();
  }, [engine, refresh]);

  const undo = useCallback(async () => {
    setSelected(null);
    setLastMove(null);
    setNote('');
    if (await engine.undo()) await refresh();
  }, [engine, refresh]);

  /** Motor bir hamle oynasın. Arama bitene kadar arayüz donar. */
  const engineMove = useCallback(async () => {
    if (busy || snapshot.status !== 'ongoing') return;
    setBusy(true);
    setNote('Motor düşünüyor...');
    try {
      const uci = await engine.bestMove(SEARCH_MS);
      if (uci && (await engine.makeMove(uci))) {
        setLastMove({ from: uci.slice(0, 2), to: uci.slice(2, 4) });
        setSelected(null);
        await refresh();
      }
      const info = await engine.lastSearchInfo();
      const nps = info.nodes > 0 ? Math.round(info.nodes / (SEARCH_MS / 1000)) : 0;
      setNote(`derinlik ${info.depth} · skor ${info.score} · ${nps.toLocaleString('tr-TR')} d/sn`);
    } finally {
      setBusy(false);
    }
  }, [busy, engine, refresh, snapshot.status]);

  const onSquarePress = useCallback(
    async (square: string) => {
      if (busy || snapshot.status !== 'ongoing') return;

      // Sadece geçerli hamlesi olan kareler seçilebilir. Böylece rakip taşı
      // veya kıpırdayamayan taş seçilemez.
      const canOriginate = snapshot.legalMoves.some(m => m.startsWith(square));

      if (selected === null) {
        if (canOriginate) setSelected(square);
        return;
      }
      if (selected === square) {
        setSelected(null);
        return;
      }

      // Terfi: legalMoves 'e7e8q' verir, iki dokunuş 'e7e8' üretir.
      // Şimdilik vezir. Adım 6'da taş seçme penceresi gelecek.
      const plain = selected + square;
      let uci = plain;
      if (!snapshot.legalMoves.includes(plain)) {
        const promo = snapshot.legalMoves.find(m => m.startsWith(plain) && m.length === 5);
        if (promo) uci = plain + 'q';
      }

      setBusy(true);
      try {
        if (await engine.makeMove(uci)) {
          setLastMove({ from: selected, to: square });
          setSelected(null);
          setNote('');
          await refresh();
        } else {
          setSelected(canOriginate ? square : null);
        }
      } finally {
        setBusy(false);
      }
    },
    [busy, engine, refresh, selected, snapshot.legalMoves, snapshot.status],
  );

  const isLandscape = width > height;
  const pad = theme.gap;
  const boardSize = Math.floor(
    isLandscape
      ? Math.min(height - pad * 2, (width - pad * 3) * 0.62)
      : Math.min(width - pad * 2, (height - pad * 2) * 0.68),
  );

  const over = snapshot.status !== 'ongoing';

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
        <Text style={styles.dim}>Köprü: {bridge}</Text>

        <Text style={styles.turn}>
          Sıra: {snapshot.sideToMove === 'w' ? 'Beyaz' : 'Siyah'}
          {snapshot.inCheck ? '  ·  ŞAH!' : ''}
        </Text>

        <Text style={over ? styles.over : styles.dim}>
          {statusText(snapshot.status, snapshot.sideToMove)}
        </Text>

        {note !== '' && <Text style={styles.note}>{note}</Text>}

        <View style={styles.buttons}>
          <Button label="Yeni oyun" onPress={newGame} />
          <Button label="Geri al" onPress={undo} />
          <Button label="Çevir" onPress={() => setFlipped(f => !f)} />
          <Button label="Motor oynasın" onPress={engineMove} />
        </View>

        <Text style={styles.section}>
          Hamleler ({snapshot.legalMoves.length} geçerli hamle)
        </Text>
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

/** ['e4','e5','Nf3'] -> '1. e4 e5   2. Nf3' */
function formatHistory(moves: string[]): string {
  const out: string[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    out.push(`${i / 2 + 1}. ${moves[i]}${moves[i + 1] ? ' ' + moves[i + 1] : ''}`);
  }
  return out.join('   ');
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
  turn: { color: theme.text, fontSize: 20, fontWeight: '700' },
  dim: { color: theme.textDim, fontSize: 13 },
  over: { color: theme.warn, fontSize: 15, fontWeight: '700' },
  note: { color: theme.warn, fontSize: 12 },
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
