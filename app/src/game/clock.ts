/**
 * KONUM: app/src/game/clock.ts   (üzerine yaz)
 *
 * Satranç saati. React'ten bağımsız, saf JavaScript.
 *
 * TASARIM 1 — sapmasız zaman: kalan süreyi azaltarak tutmuyoruz. Sıra
 * başlarken kalan süreyi (`base`) ve başlama anını (`startedAt`) saklıyoruz;
 * gösterilecek değer her seferinde `base - (şimdi - startedAt)`.
 *
 * TASARIM 2 — donma tespiti: uygulama arka plana alınınca Android JS'i
 * durdurur ve AppState haberi GEÇ gelir; o boşluk yanlışlıkla harcanmış
 * süre sayılırdı. Saat 200 ms'de bir "yaşıyorum" damgası vuruyor (`beat`).
 * İki damga arası 1 saniyeyi aşarsa donmuş olduğumuzu anlıyor ve hesabı
 * SON DAMGA anına kadar yapıp kendini duraklatıyor.
 */

import type { Side } from '../chess/engine';
import type { TimeControl } from './types';

/** Motor süre ayarları — hepsi burada, istediğin gibi oynayabilirsin. */
export const THINK_TUNING = {
  /** Üst sınır = capBaseMs + capPerLevelMs * seviye  (0→400ms, 20→3000ms) */
  capBaseMs: 400,
  capPerLevelMs: 200,
  /** Kalan sürenin kaçta biri hedeflensin */
  budgetDivisor: 40,
  /** Eklentinin ne kadarı kullanılsın */
  incrementUse: 0.8,
  /** Tek hamlede kalan sürenin en fazla bu oranı harcansın */
  maxShareOfRemaining: 0.2,
  minMs: 150,
  /** Bayrağı düşürmemek için bırakılan pay */
  safetyMs: 300,
};

/** Bu süreden uzun bir damga boşluğu = JS donmuştu. */
const FREEZE_GAP_MS = 1000;

export type Clock = {
  enabled: boolean;
  incrementMs: number;
  remaining(side: Side): number;
  active(): Side | null;
  flagged(): Side | null;

  start(side: Side): void;
  switchTo(next: Side): void;
  /** atMs verilirse hesap o ana kadar yapılır (donma sonrası için). */
  pause(atMs?: number): void;
  resume(): void;
  reset(): void;
  takeFlag(): Side | null;

  /** Canlılık damgası. Donma tespitini bu yapıyor. */
  beat(): void;
};

export function createClock(time: TimeControl): Clock {
  const enabled = time !== null;
  const initialMs = time?.initialMs ?? 0;
  const incrementMs = time?.incrementMs ?? 0;

  let base: Record<Side, number> = { w: initialMs, b: initialMs };
  let running: Side | null = null;
  let startedAt: number | null = null;
  let flaggedSide: Side | null = null;
  let flagReported = false;
  let pausedSide: Side | null = null;
  let lastBeat = Date.now();

  const remainingOf = (side: Side): number => {
    if (!enabled) return Infinity;
    let ms = base[side];
    if (running === side && startedAt !== null) ms -= Date.now() - startedAt;
    return Math.max(0, ms);
  };

  /** İşleyen tarafın harcadığı süreyi kalıcı hale getirir. */
  const commit = (atMs?: number) => {
    if (running !== null && startedAt !== null) {
      const end = atMs ?? Date.now();
      base[running] = Math.max(0, base[running] - Math.max(0, end - startedAt));
    }
    startedAt = null;
  };

  const doPause = (atMs?: number) => {
    if (!enabled || running === null) return;
    pausedSide = running;
    commit(atMs);
    running = null;
  };

  return {
    enabled,
    incrementMs,
    remaining: remainingOf,
    active: () => running,
    flagged: () => flaggedSide,

    start(side) {
      if (!enabled) return;
      commit();
      running = side;
      startedAt = Date.now();
      pausedSide = null;
      lastBeat = Date.now();
    },

    switchTo(next) {
      if (!enabled) return;
      const mover = running;
      commit();
      if (mover !== null) base[mover] += incrementMs;
      running = next;
      startedAt = Date.now();
      pausedSide = null;
      lastBeat = Date.now();
    },

    pause(atMs) {
      doPause(atMs);
    },

    resume() {
      if (!enabled || pausedSide === null || flaggedSide !== null) return;
      running = pausedSide;
      pausedSide = null;
      startedAt = Date.now();
      lastBeat = Date.now();
    },

    reset() {
      base = { w: initialMs, b: initialMs };
      running = null;
      startedAt = null;
      flaggedSide = null;
      flagReported = false;
      pausedSide = null;
      lastBeat = Date.now();
    },

    beat() {
      if (!enabled) return;
      const now = Date.now();
      const gap = now - lastBeat;
      lastBeat = now;
      // Damgalar arasında büyük boşluk = JS donmuştu. Aradaki süreyi sayma.
      if (gap > FREEZE_GAP_MS && running !== null) {
        doPause(now - gap);
      }
    },

    takeFlag() {
      if (!enabled || running === null) return null;
      if (flaggedSide === null && remainingOf(running) <= 0) {
        flaggedSide = running;
        commit();
        running = null;
      }
      if (flaggedSide !== null && !flagReported) {
        flagReported = true;
        return flaggedSide;
      }
      return null;
    },
  };
}

/** 10:00 · 1:05 · son 10 saniyede ondalıklı: 7.3 */
export function formatClock(ms: number): string {
  if (!Number.isFinite(ms)) return '\u221E';
  if (ms <= 0) return '0:00';
  if (ms < 10_000) return (Math.ceil(ms / 100) / 10).toFixed(1);
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

/**
 * Motorun bu hamleye ayıracağı süre.
 *
 * Üst sınır SEVİYEYE bağlı: zayıf seviyedeki motorun uzun düşünmesi anlamsız,
 * zaten bulduğu hamleyi bilerek bozacak. Ayrıca oyun akıcı kalıyor.
 */
export function allocateThinkTime(
  remainingMs: number,
  incrementMs: number,
  level: number,
): number {
  const t = THINK_TUNING;
  const cap = t.capBaseMs + t.capPerLevelMs * Math.max(0, Math.min(20, level));

  if (!Number.isFinite(remainingMs)) return Math.round(cap);

  const budget = remainingMs / t.budgetDivisor + incrementMs * t.incrementUse;
  const safety = Math.max(
    100,
    Math.min(remainingMs - t.safetyMs, remainingMs * t.maxShareOfRemaining),
  );

  return Math.round(Math.min(Math.max(budget, t.minMs), cap, safety));
}
