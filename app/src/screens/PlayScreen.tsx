/**
 * KONUM: app/src/screens/PlayScreen.tsx   (üzerine yaz)
 *
 * Adım 6.5: tüm metinler sözlükten.
 *
 * Değişenler:
 *  - statusText / scoreText artık game/labels.ts'ten (dil bilen sürüm)
 *  - düğüm sayısı formatNumber ile (tr: 477.366, en: 477,366)
 *  - değerlendirme '+1.25' / '#3' — çevrilmiyor, satrancın ortak gösterimi
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
import ClockView from '../components/ClockView';
import PromotionDialog from '../components/PromotionDialog';
import GameOverDialog from '../components/GameOverDialog';
import { theme } from '../theme';
import { createEngine } from '../chess/createEngine';
import {
  EMPTY_SNAPSHOT,
  type ChessEngine,
  type SearchProgress,
  type Side,
  type Snapshot,
} from '../chess/engine';
import { fenToBoard, indexToSquare } from '../chess/fen';
import { modeLabel, timeLabel } from '../game/types';
import { evalText, sideName, statusText } from '../game/labels';
import { allocateThinkTime } from '../game/clock';
import { useClock } from '../game/useClock';
import { formatNumber, t, useLanguage } from '../i18n';
import type { PlayStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<PlayStackParamList, 'Game'>;

const PROGRESS_THROTTLE_MS = 250;
const MAX_ENGINE_FAILURES = 3;

type MoveResult = 'moved' | 'promotion' | 'illegal';

export default function PlayScreen({ route, navigation }: Props) {
  useLanguage();

  const settings = route.params.settings;
  const vsEngine = settings.mode !== 'local';

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
  const failCountRef = useRef(0);

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
  const [timeoutSide, setTimeoutSide] = useState<Side | null>(null);
  const [resumeTick, setResumeTick] = useState(0);
  const [promotion, setPromotion] = useState<{ from: string; to: string } | null>(null);
  const [overDismissed, setOverDismissed] = useState(false);

  const onFlag = useCallback(
    (side: Side) => {
      engine.stop();
      setTimeoutSide(side);
      setNote('');
    },
    [engine],
  );

  const clock = useClock(settings.time, onFlag);

  const startGame = useCallback(async () => {
    setSelected(null);
    setLastMove(null);
    setAnimating(null);
    setNote('');
    setReady(false);
    setTimeoutSide(null);
    setPromotion(null);
    setOverDismissed(false);
    failCountRef.current = 0;
    cancelledRef.current = false;
    clock.reset();
    try {
      await engine.setSkillLevel(settings.level);
      await engine.setUseBook(settings.useBook !== false);
      await engine.newGame('');
      setSnapshot(await engine.snapshot());
      clock.start('w');
      setReady(true);
    } catch (e) {
      setNote(String(e));
    }
  }, [clock, engine, settings.level]);

  useEffect(() => {
    startGame();
  }, [startGame]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active') {
        cancelledRef.current = true;
        engine.stop();
        clock.pause();
      } else {
        clock.resume();
        setResumeTick(n => n + 1);
      }
    });
    return () => sub.remove();
  }, [clock, engine]);

  useEffect(() => {
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
      engine.stop();
      clock.pause();
    };
  }, [clock, engine]);

  const applyMove = useCallback(
    async (from: string, to: string) => {
      setLastMove({ from, to });
      setAnimating({ from, to });
      setSelected(null);

      const next = await engine.snapshot();
      setSnapshot(next);

      if (next.status === 'ongoing') {
        clock.switchTo(next.sideToMove);
      } else {
        clock.pause();
      }

      if (animTimerRef.current) clearTimeout(animTimerRef.current);
      animTimerRef.current = setTimeout(() => setAnimating(null), theme.anim.move + 30);
    },
    [clock, engine],
  );

  const engineMove = useCallback(async () => {
    if (engineBusyRef.current) return;
    engineBusyRef.current = true;

    try {
      const before = await engine.snapshot();
      if (before.status !== 'ongoing' || before.sideToMove !== engineColor) return;
      if (clock.flagged() !== null) return;

      cancelledRef.current = false;
      searchStartRef.current = Date.now();
      lastProgressRef.current = 0;
      setThinking(true);
      setNote(t('play.thinking'));

      const searchMs = allocateThinkTime(
        clock.remaining(engineColor),
        clock.incrementMs,
        settings.level,
      );

      const onProgress = (p: SearchProgress) => {
        const now = Date.now();
        if (now - lastProgressRef.current < PROGRESS_THROTTLE_MS) return;
        lastProgressRef.current = now;
        const elapsedSec = Math.max(1, now - searchStartRef.current) / 1000;
        setNote(
          t('play.searchInfo', {
            depth: p.depth,
            score: evalText(p),
            nps: formatNumber(Math.round(p.nodes / elapsedSec)),
          }),
        );
      };

      const uci = await engine.bestMove(searchMs, 64, onProgress);

      if (cancelledRef.current) { setNote(''); return; }
      if (clock.flagged() !== null) { setNote(''); return; }

      const after = await engine.snapshot();
      if (after.status !== 'ongoing' || after.sideToMove !== engineColor) {
        setNote('');
        return;
      }

      if (!uci) {
        failCountRef.current += 1;
        setNote(t('play.noMoveFound'));
        return;
      }

      if (await engine.makeMove(uci)) {
        failCountRef.current = 0;
        setNote('');
        await applyMove(uci.slice(0, 2), uci.slice(2, 4));
      } else {
        failCountRef.current += 1;
      }
    } finally {
      engineBusyRef.current = false;
      setThinking(false);
    }
  }, [applyMove, clock, engine, engineColor, settings.level]);

  useEffect(() => {
    if (!ready || !vsEngine) return;
    if (engineBusyRef.current || thinking) return;
    if (timeoutSide !== null) return;
    if (promotion !== null) return;
    if (failCountRef.current >= MAX_ENGINE_FAILURES) return;
    if (snapshot.status !== 'ongoing') return;
    if (snapshot.sideToMove !== engineColor) return;
    if (snapshot.legalMoves.length === 0) return;
    engineMove();
  }, [
    ready, vsEngine, snapshot, engineColor, engineMove,
    timeoutSide, resumeTick, thinking, promotion,
  ]);

  const undo = useCallback(async () => {
    if (thinking || engineBusyRef.current || timeoutSide !== null) return;
    setSelected(null);
    setLastMove(null);
    setAnimating(null);
    setNote('');
    setPromotion(null);
    setOverDismissed(false);
    failCountRef.current = 0;

    if (!(await engine.undo())) return;
    if (vsEngine) {
      const s = await engine.snapshot();
      if (s.sideToMove !== userColor) await engine.undo();
    }
    const next = await engine.snapshot();
    setSnapshot(next);
    setTimeoutSide(null);
    clock.start(next.sideToMove);
  }, [clock, engine, thinking, timeoutSide, userColor, vsEngine]);

  const stopSearch = useCallback(() => engine.stop(), [engine]);

  const tryMove = useCallback(
    async (from: string, to: string): Promise<MoveResult> => {
      const plain = from + to;

      if (snapshot.legalMoves.includes(plain)) {
        if (await engine.makeMove(plain)) {
          setNote('');
          await applyMove(from, to);
          return 'moved';
        }
        return 'illegal';
      }

      const hasPromo = snapshot.legalMoves.some(
        m => m.length === 5 && m.startsWith(plain),
      );
      if (hasPromo) {
        setPromotion({ from, to });
        setSelected(null);
        return 'promotion';
      }

      return 'illegal';
    },
    [applyMove, engine, snapshot.legalMoves],
  );

  const completePromotion = useCallback(
    async (code: 'q' | 'r' | 'b' | 'n') => {
      if (promotion === null) return;
      const { from, to } = promotion;
      setPromotion(null);
      setBusy(true);
      try {
        if (await engine.makeMove(from + to + code)) {
          setNote('');
          await applyMove(from, to);
        }
      } finally {
        setBusy(false);
      }
    },
    [applyMove, engine, promotion],
  );

  const canOriginate = useCallback(
    (square: string) => {
      if (vsEngine && snapshot.sideToMove !== userColor) return false;
      return snapshot.legalMoves.some(m => m.startsWith(square));
    },
    [snapshot.legalMoves, snapshot.sideToMove, userColor, vsEngine],
  );

  const over = snapshot.status !== 'ongoing' || timeoutSide !== null;
  const inputLocked = busy || thinking || over || promotion !== null;

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
        const result = await tryMove(selected, square);
        if (result === 'illegal') {
          setSelected(canOriginate(square) ? square : null);
        }
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
        const result = await tryMove(from, to);
        if (result === 'illegal') setSelected(from);
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

  const resultText =
    timeoutSide !== null
      ? t('play.timeUp', { winner: sideName(timeoutSide === 'w' ? 'b' : 'w') })
      : statusText(snapshot.status, snapshot.sideToMove);

  const scoreLine = useMemo(() => {
    if (timeoutSide !== null) return timeoutSide === 'w' ? '0-1' : '1-0';
    if (snapshot.status === 'checkmate') return snapshot.sideToMove === 'w' ? '0-1' : '1-0';
    if (snapshot.status === 'ongoing') return '';
    return '\u00BD-\u00BD';
  }, [snapshot.sideToMove, snapshot.status, timeoutSide]);

  const topSide: Side = flipped ? 'w' : 'b';
  const bottomSide: Side = flipped ? 'b' : 'w';

  return (
    <View
      style={[styles.root, isLandscape ? styles.rowLayout : styles.colLayout]}
      onLayout={e => {
        const { width, height } = e.nativeEvent.layout;
        setBox({ width, height });
      }}
    >
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
        <ClockView clock={clock} side={topSide} label={sideName(topSide)} />

        <Text style={styles.dim}>
          {modeLabel(settings.mode)} · {timeLabel(settings.time)}
          {vsEngine && ` · ${t('play.youAre', { color: sideName(userColor).toLowerCase() })}`}
        </Text>

        <Text style={styles.turn}>
          {t('play.turn', { side: sideName(snapshot.sideToMove) })}
          {snapshot.inCheck ? `  ·  ${t('play.check')}` : ''}
        </Text>

        <Text style={over ? styles.over : styles.dim}>{resultText}</Text>

        <Text style={styles.note} numberOfLines={1}>{note}</Text>

        <ClockView clock={clock} side={bottomSide} label={sideName(bottomSide)} />

        <View style={styles.buttons}>
          <Button label={t('play.again')} onPress={startGame} />
          <Button label={t('play.undo')} onPress={undo} />
          <Button label={t('play.flip')} onPress={() => setFlipped(f => !f)} />
          {thinking && <Button label={t('play.stop')} onPress={stopSearch} />}
          {!vsEngine && !thinking && !over && (
            <Button label={t('play.engineMove')} onPress={engineMove} />
          )}
          <Button label={t('common.menu')} onPress={() => navigation.goBack()} />
        </View>

        <Text style={styles.section}>{t('play.moves')}</Text>
        <ScrollView style={styles.historyBox}>
          <Text style={styles.historyText}>
            {snapshot.historySan.length > 0
              ? formatHistory(snapshot.historySan)
              : t('play.noMoves')}
          </Text>
        </ScrollView>
      </View>

      <PromotionDialog
        visible={promotion !== null}
        side={snapshot.sideToMove}
        size={Math.floor(boardSize / 8)}
        onPick={completePromotion}
        onCancel={() => setPromotion(null)}
      />

      <GameOverDialog
        visible={over && !overDismissed}
        title={resultText}
        score={scoreLine}
        onRematch={startGame}
        onMenu={() => navigation.goBack()}
        onClose={() => setOverDismissed(true)}
      />
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
    alignItems: 'center',
    justifyContent: 'flex-start',
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
  turn: { color: theme.text, fontSize: 18, fontWeight: '700' },
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
  historyBox: { height: 100 },
  historyText: { color: theme.textDim, fontSize: 14, lineHeight: 22 },
});
