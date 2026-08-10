/**
 * KONUM: app/src/screens/PlayScreen.tsx   (üzerine yaz)
 *
 * DÜZELTME (tahta sallanması):
 *  - Kök artık içeriği dikeyde ORTALAMIYOR. Ortalanmış yığında panel uzayıp
 *    kısaldıkça tahta yukarı aşağı kayıyordu.
 *  - Tahta sabit ölçülü bir kutuya alındı; panel kalan alanı doldurur,
 *    içeriği değişse de tahtayı itmez.
 *  - Bilgi satırı her zaman çizilir (boşken bile), sabit yükseklikte.
 *  - Hamle listesi sabit yükseklikte.
 *  - Arama bilgisi 80 ms yerine 250 ms'de bir güncellenir.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import Board from '../components/Board';
import { theme } from '../theme';
import { createEngine } from '../chess/createEngine';
import {
  EMPTY_SNAPSHOT,
  scoreText,
  statusText,
  type ChessEngine,
  type SearchProgress,
  type Side,
  type Snapshot,
} from '../chess/engine';
import { fenToBoard, indexToSquare } from '../chess/fen';
import { modeLabel, thinkTimeMs, timeLabel } from '../game/types';
import type { PlayStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<PlayStackParamList, 'Game'>;

const PROGRESS_THROTTLE_MS = 250;

export default function PlayScreen({ route, navigation }: Props) {
  const settings = route.params.settings;
  const vsEngine = settings.mode !== 'local';
  const searchMs = thinkTimeMs(settings.time);

  const userColorRef = useRef<Side>(
    settings.color === 'random'
      ? Math.random() < 0.5 ? 'w' : 'b'
      : settings.color,
  );
  const userColor = userColorRef.current;
  const engineColor: Side = userColor === 'w' ? 'b' : 'w';

  const engineRef = useRef<ChessEngine | null>(null);
  if (engineRef.current === null) engineRef.current = createEngine();
  const engine = engineRef.current;

  const searchStartRef = useRef(0);
  const lastProgressRef = useRef(0);
  const cancelledRef = useRef(false);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const engineBusyRef = useRef(false);

  const [box, setBox] = useState({ width: 0, height: 0 });
  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY_SNAPSHOT);
  const [selected, setSelected] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [animating, setAnimating] = useState<{ from: string; to: string } | null>(null);
  const [flipped, setFlipped] = useState(userColor === 'b');
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [note, setNote] = useState('');
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setSnapshot(await engine.snapshot());
    } catch (e) {
      setNote(`HATA snapshot: ${String(e)}`);
    }
  }, [engine]);

  const startGame = useCallback(async () => {
    setSelected(null);
    setLastMove(null);
    setAnimating(null);
    setNote('');
    setReady(false);
    try {
      await engine.setSkillLevel(settings.level);
      await engine.newGame('');
      setSnapshot(await engine.snapshot());
      setReady(true);
    } catch (e) {
      setNote(`HATA baslangic: ${String(e)}`);
    }
  }, [engine, settings.level]);

  useEffect(() => {
    startGame();
  }, [startGame]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active') {
        cancelledRef.current = true;
        engine.stop();
      }
    });
    return () => sub.remove();
  }, [engine]);

  useEffect(() => {
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
      engine.stop();
    };
  }, [engine]);

  const applyMove = useCallback(
    async (from: string, to: string) => {
      setLastMove({ from, to });
      setAnimating({ from, to });
      setSelected(null);
      await refresh();

      if (animTimerRef.current) clearTimeout(animTimerRef.current);
      animTimerRef.current = setTimeout(() => setAnimating(null), theme.anim.move + 30);
    },
    [refresh],
  );

  const engineMove = useCallback(async () => {
    if (engineBusyRef.current) return;
    engineBusyRef.current = true;
    cancelledRef.current = false;
    searchStartRef.current = Date.now();
    lastProgressRef.current = 0;
    setThinking(true);
    setNote('Motor düşünüyor...');

    const onProgress = (p: SearchProgress) => {
      // Kısılma: saniyede 12 kez yerine 4 kez ekran güncelle.
      const now = Date.now();
      if (now - lastProgressRef.current < PROGRESS_THROTTLE_MS) return;
      lastProgressRef.current = now;

      const elapsedSec = Math.max(1, now - searchStartRef.current) / 1000;
      const nps = Math.round(p.nodes / elapsedSec);
      setNote(`derinlik ${p.depth} · ${scoreText(p)} · ${nps.toLocaleString('tr-TR')} d/sn`);
    };

    try {
      const uci = await engine.bestMove(searchMs, 64, onProgress);

      if (cancelledRef.current) { setNote('Arama iptal edildi.'); return; }
      if (!uci) { setNote('Motor hamle bulamadı.'); return; }

      if (await engine.makeMove(uci)) {
        await applyMove(uci.slice(0, 2), uci.slice(2, 4));
      }
    } finally {
      engineBusyRef.current = false;
      setThinking(false);
    }
  }, [applyMove, engine, searchMs]);

  useEffect(() => {
    if (!ready || !vsEngine) return;
    if (engineBusyRef.current) return;
    if (snapshot.status !== 'ongoing') return;
    if (snapshot.sideToMove !== engineColor) return;
    if (snapshot.legalMoves.length === 0) return;
    engineMove();
  }, [ready, vsEngine, snapshot, engineColor, engineMove]);

  const undo = useCallback(async () => {
    if (thinking || engineBusyRef.current) return;
    setSelected(null);
    setLastMove(null);
    setAnimating(null);
    setNote('');

    if (!(await engine.undo())) return;
    if (vsEngine) {
      const s = await engine.snapshot();
      if (s.sideToMove !== userColor) await engine.undo();
    }
    await refresh();
  }, [engine, refresh, thinking, userColor, vsEngine]);

  const stopSearch = useCallback(() => engine.stop(), [engine]);

  const tryMove = useCallback(
    async (from: string, to: string): Promise<boolean> => {
      const plain = from + to;
      let uci = plain;
      if (!snapshot.legalMoves.includes(plain)) {
        const promo = snapshot.legalMoves.find(m => m.startsWith(plain) && m.length === 5);
        if (!promo) return false;
        uci = plain + 'q'; // Adım 6.4: taş seçme penceresi
      }
      if (await engine.makeMove(uci)) {
        await applyMove(from, to);
        setNote('');
        return true;
      }
      return false;
    },
    [applyMove, engine, snapshot.legalMoves],
  );

  const canOriginate = useCallback(
    (square: string) => {
      if (vsEngine && snapshot.sideToMove !== userColor) return false;
      return snapshot.legalMoves.some(m => m.startsWith(square));
    },
    [snapshot.legalMoves, snapshot.sideToMove, userColor, vsEngine],
  );

  const inputLocked = busy || thinking || snapshot.status !== 'ongoing';

  const onTap = useCallback(
    async (square: string) => {
      if (inputLocked) return;
      if (selected === null) {
        if (canOriginate(square)) setSelected(square);
        return;
      }
      if (selected === square) { setSelected(null); return; }

      setBusy(true);
      try {
        const ok = await tryMove(selected, square);
        if (!ok) setSelected(canOriginate(square) ? square : null);
      } finally {
        setBusy(false);
      }
    },
    [canOriginate, inputLocked, selected, tryMove],
  );

  const onDrop = useCallback(
    async (from: string, to: string | null) => {
      if (to === null || to === from) { setSelected(from); return; }
      setBusy(true);
      try {
        const ok = await tryMove(from, to);
        if (!ok) setSelected(from);
      } finally {
        setBusy(false);
      }
    },
    [tryMove],
  );

  const canDrag = useCallback(
    (square: string) => !inputLocked && canOriginate(square),
    [canOriginate, inputLocked],
  );

  const checkSquare = useMemo(() => {
    if (!snapshot.inCheck) return null;
    const wanted = snapshot.sideToMove === 'w' ? 'K' : 'k';
    const board = fenToBoard(snapshot.fen);
    const index = board.findIndex(p => p === wanted);
    return index >= 0 ? indexToSquare(index) : null;
  }, [snapshot.fen, snapshot.inCheck, snapshot.sideToMove]);

  const pad = theme.gap;
  const availW = Math.max(0, box.width - pad * 2);
  const availH = Math.max(0, box.height - pad * 2);
  const isLandscape = availW > availH;
  const MIN_PANEL = 280;
  const boardSize = Math.floor(
    isLandscape
      ? Math.min(availH, availW - MIN_PANEL - pad)
      : Math.min(availW, availH * 0.62),
  );

  const over = snapshot.status !== 'ongoing';

  return (
    <View
      style={[styles.root, isLandscape ? styles.rowLayout : styles.colLayout]}
      onLayout={e => {
        const { width, height } = e.nativeEvent.layout;
        setBox({ width, height });
      }}
    >
      {/* Sabit ölçülü kutu: içerideki tahta ne olursa olsun bu kutu kımıldamaz */}
      <View style={{ width: boardSize, height: boardSize }}>
        {boardSize > 40 && (
          <Board
            fen={snapshot.fen}
            size={boardSize}
            selected={selected}
            legalMoves={snapshot.legalMoves}
            lastMove={lastMove}
            animating={animating}
            checkSquare={checkSquare}
            flipped={flipped}
            enabled={!inputLocked}
            onTap={onTap}
            canDrag={canDrag}
            onDrop={onDrop}
          />
        )}
      </View>

      <View style={[styles.panel, isLandscape ? styles.panelSide : styles.panelBottom]}>
        <Text style={styles.dim}>
          {modeLabel(settings.mode)} · {timeLabel(settings.time)}
          {vsEngine && ` · sen ${userColor === 'w' ? 'beyaz' : 'siyah'}`}
        </Text>

        <Text style={styles.turn}>
          Sıra: {snapshot.sideToMove === 'w' ? 'Beyaz' : 'Siyah'}
          {snapshot.inCheck ? '  ·  ŞAH!' : ''}
        </Text>

        <Text style={over ? styles.over : styles.dim}>
          {statusText(snapshot.status, snapshot.sideToMove)}
        </Text>

        {/* Boşken de çizilir: satır gelip gitmesin, yükseklik sabit kalsın */}
        <Text style={styles.note} numberOfLines={1}>
          {note}
        </Text>

        <View style={styles.buttons}>
          <Button label="Yeniden" onPress={startGame} />
          <Button label="Geri al" onPress={undo} />
          <Button label="Çevir" onPress={() => setFlipped(f => !f)} />
          {thinking && <Button label="Durdur" onPress={stopSearch} />}
          {!vsEngine && !thinking && (
            <Button label="Motor oynasın" onPress={engineMove} />
          )}
          <Button label="Menü" onPress={() => navigation.goBack()} />
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
    padding: theme.gap,
    gap: theme.gap,
    alignItems: 'center',       // çapraz eksende ortala (kararlı)
    justifyContent: 'flex-start', // ana eksende ORTALAMA — kayma buradan geliyordu
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
  panelBottom: { alignSelf: 'stretch', flex: 1 },
  panelSide: { flex: 1, maxWidth: 340, alignSelf: 'stretch' },
  turn: { color: theme.text, fontSize: 20, fontWeight: '700' },
  dim: { color: theme.textDim, fontSize: 13 },
  over: { color: theme.warn, fontSize: 15, fontWeight: '700' },
  note: { color: theme.warn, fontSize: 12, minHeight: 16 },
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
  historyBox: { height: 120 },
  historyText: { color: theme.textDim, fontSize: 14, lineHeight: 22 },
});
