/**
 * KONUM: app/src/game/labels.ts   (yeni dosya)
 *
 * Ekranda görünen satranç metinleri. Sözlükten okur.
 *
 * Neden ayrı dosya: `chess/engine.ts` motorun sözleşmesi, dil bilmemeli.
 * Oradaki `statusText` artık kullanılmıyor — istersen silebilirsin.
 *
 * `evalText` bilerek çevrilmiyor: `+1.25` ve `#3` satranç dünyasının ortak
 * gösterimi, her dilde aynı yazılır.
 */

import { t } from '../i18n';
import type { SearchProgress, Side, Status } from '../chess/engine';

export function sideName(side: Side): string {
  return side === 'w' ? t('common.white') : t('common.black');
}

export function statusText(status: Status, sideToMove: Side): string {
  switch (status) {
    case 'ongoing':
      return t('status.ongoing');
    case 'checkmate':
      // Mat olan taraf oynayacak olandır.
      return sideToMove === 'w'
        ? t('status.checkmateBlackWins')
        : t('status.checkmateWhiteWins');
    case 'stalemate':
      return t('status.stalemate');
    case 'draw-fifty':
      return t('status.drawFifty');
    case 'draw-repetition':
      return t('status.drawRepetition');
    case 'draw-material':
      return t('status.drawMaterial');
    default:
      return String(status);
  }
}

export function levelLabel(level: number): string {
  return t(`levels.l${level}`);
}

/** '+1.25' veya '#3' — dilden bağımsız satranç gösterimi. */
export function evalText(p: SearchProgress): string {
  if (p.mate) return (p.score >= 0 ? '#' : '-#') + String(Math.abs(p.score));
  return (p.score >= 0 ? '+' : '') + (p.score / 100).toFixed(2);
}
