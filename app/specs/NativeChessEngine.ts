/**
 * KONUM: app/specs/NativeChessEngine.ts   (mevcut dosyanın üzerine yaz)
 *
 * Sadece string / number / boolean / void kullanılıyor. Codegen dizi ve nesne
 * tiplerini de destekliyor ama derleme hatası riski daha yüksek; durum
 * bilgisini JSON metni olarak taşıyoruz.
 *
 * EngineApi'deki getFen / sideToMove / legalMoves / gameStatus /
 * moveHistorySan tek bir snapshot() çağrısında birleşti: her köprü geçişinin
 * bir maliyeti var, hamle başına beş geçiş yerine bir geçiş yapıyoruz.
 */

import { TurboModule, TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  readonly nativeVersion: () => string;

  /** fen boş verilirse başlangıç pozisyonu. */
  readonly newGame: (fen: string) => boolean;

  /** JSON: { fen, side, status, check, legal[], history[] } */
  readonly snapshot: () => string;

  readonly makeMove: (uci: string) => boolean;
  readonly undo: () => boolean;
  readonly sanFor: (uci: string) => string;

  /** DİKKAT: bloke eder, JS thread'ini dondurur. Adım 4'te çözülecek. */
  readonly bestMove: (timeMs: number, maxDepth: number) => string;
  readonly stop: () => void;

  readonly setSkillLevel: (level: number) => void;
  readonly getSkillLevel: () => number;
  readonly setHashSizeMB: (mb: number) => void;

  /** JSON: { score, depth, nodes } — son aramanın sonucu. */
  readonly lastSearchInfo: () => string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeChessEngine');
