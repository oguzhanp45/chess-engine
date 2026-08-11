/**
 * KONUM: app/src/game/types.ts   (üzerine yaz)
 *
 * Değişiklik: gömülü Türkçe etiketler kaldırıldı. Seviye adları artık
 * sözlük anahtarı; mod ve süre etiketleri t() üzerinden üretiliyor.
 *
 * Süre etiketleri ('5+3') çevrilmiyor — rakam ve artı işareti her dilde aynı.
 * Yalnızca "Süresiz" sözlükten geliyor.
 */

import { t } from '../i18n';

export type GameMode = 'ai' | 'tutor' | 'local';
export type ColorChoice = 'w' | 'b' | 'random';

/** null = süresiz. */
export type TimeControl = { initialMs: number; incrementMs: number } | null;

export type GameSettings = {
  mode: GameMode;
  color: ColorChoice;
  time: TimeControl;
  level: number; // 0-20, EngineApi.setSkillLevel ile aynı ölçek
  useBook: boolean;
};

export const DEFAULT_SETTINGS: GameSettings = {
  mode: 'ai',
  color: 'w',
  time: { initialMs: 10 * 60_000, incrementMs: 0 },
  level: 8,
  useBook: true,
};

/** Sabit etiket = dilden bağımsız gösterim. 'unlimited' özel durum. */
export const TIME_PRESETS: { id: string; time: TimeControl }[] = [
  { id: '1+0', time: { initialMs: 60_000, incrementMs: 0 } },
  { id: '2+1', time: { initialMs: 120_000, incrementMs: 1_000 } },
  { id: '3+0', time: { initialMs: 180_000, incrementMs: 0 } },
  { id: '3+2', time: { initialMs: 180_000, incrementMs: 2_000 } },
  { id: '5+0', time: { initialMs: 300_000, incrementMs: 0 } },
  { id: '5+3', time: { initialMs: 300_000, incrementMs: 3_000 } },
  { id: '10+0', time: { initialMs: 600_000, incrementMs: 0 } },
  { id: '10+5', time: { initialMs: 600_000, incrementMs: 5_000 } },
  { id: '15+10', time: { initialMs: 900_000, incrementMs: 10_000 } },
  { id: '30+0', time: { initialMs: 1_800_000, incrementMs: 0 } },
  { id: 'unlimited', time: null },
];

/**
 * Seviye adları sözlükte (levels.l0 ... levels.l20).
 * Gerçek Elo değerleri cutechess-cli ölçümünden sonra eklenecek.
 */
export const LEVEL_VALUES = [0, 4, 8, 12, 16, 20];

/** '5+3' veya 'unlimited' — TIME_PRESETS.id ile karşılaştırmak için. */
export function timeId(time: TimeControl): string {
  if (time === null) return 'unlimited';
  const min = Math.round(time.initialMs / 60_000);
  const inc = Math.round(time.incrementMs / 1000);
  return `${min}+${inc}`;
}

/** Ekranda gösterilecek süre metni. */
export function timeLabel(time: TimeControl): string {
  return time === null ? t('newGame.unlimited') : timeId(time);
}

export function modeLabel(mode: GameMode): string {
  if (mode === 'local') return t('newGame.local');
  if (mode === 'tutor') return t('newGame.tutor');
  return t('newGame.ai');
}
