/**
 * KONUM: app/src/game/types.ts   (yeni dosya, yeni klasör)
 *
 * Bir oyunun kurulum bilgisi. Kurulum ekranı bunu üretir, oyun ekranı tüketir.
 * Adım 7'de aynı yapı veritabanına yazılacak, o yüzden sade tutuyoruz:
 * sadece ilkel tipler, iç içe nesne yok.
 */

export type GameMode = 'ai' | 'tutor' | 'local';
export type ColorChoice = 'w' | 'b' | 'random';

/** null = süresiz. */
export type TimeControl = { initialMs: number; incrementMs: number } | null;

export type GameSettings = {
  mode: GameMode;
  color: ColorChoice;
  time: TimeControl;
  level: number; // 0-20, EngineApi.setSkillLevel ile aynı ölçek
};

export const DEFAULT_SETTINGS: GameSettings = {
  mode: 'ai',
  color: 'w',
  time: { initialMs: 10 * 60_000, incrementMs: 0 },
  level: 8,
};

export const TIME_PRESETS: { label: string; time: TimeControl }[] = [
  { label: '1+0', time: { initialMs: 60_000, incrementMs: 0 } },
  { label: '2+1', time: { initialMs: 120_000, incrementMs: 1_000 } },
  { label: '3+0', time: { initialMs: 180_000, incrementMs: 0 } },
  { label: '3+2', time: { initialMs: 180_000, incrementMs: 2_000 } },
  { label: '5+0', time: { initialMs: 300_000, incrementMs: 0 } },
  { label: '5+3', time: { initialMs: 300_000, incrementMs: 3_000 } },
  { label: '10+0', time: { initialMs: 600_000, incrementMs: 0 } },
  { label: '10+5', time: { initialMs: 600_000, incrementMs: 5_000 } },
  { label: '15+10', time: { initialMs: 900_000, incrementMs: 10_000 } },
  { label: '30+0', time: { initialMs: 1_800_000, incrementMs: 0 } },
  { label: 'Süresiz', time: null },
];

/**
 * Seviye etiketleri şimdilik tanımlayıcı. Gerçek Elo değerleri
 * cutechess-cli ölçümünden sonra buraya yazılacak (Adım 6 motor işi).
 */
export const LEVEL_PRESETS: { level: number; label: string }[] = [
  { level: 0, label: 'Acemi' },
  { level: 4, label: 'Başlangıç' },
  { level: 8, label: 'Orta' },
  { level: 12, label: 'İyi' },
  { level: 16, label: 'Zor' },
  { level: 20, label: 'Tam güç' },
];

/** Motorun bir hamleye ayıracağı süre. Saat gelince (Adım 6.3) yenilenecek. */
export function thinkTimeMs(time: TimeControl): number {
  if (time === null) return 2000;
  // Kaba kural: başlangıç süresinin kırkta biri, 500–4000 ms arasına sıkıştırılmış.
  return Math.min(4000, Math.max(500, Math.round(time.initialMs / 40)));
}

export function timeLabel(time: TimeControl): string {
  if (time === null) return 'Süresiz';
  const min = Math.round(time.initialMs / 60_000);
  const inc = Math.round(time.incrementMs / 1000);
  return `${min}+${inc}`;
}

export function modeLabel(mode: GameMode): string {
  if (mode === 'local') return 'Yerel 1v1';
  if (mode === 'tutor') return 'Eğitmen';
  return 'Yapay Zeka';
}
