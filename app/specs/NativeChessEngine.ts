/**
 * KONUM: app/specs/NativeChessEngine.ts   (üzerine yaz)
 *
 * bestMove kaldırıldı. Yerine üçlü:
 *   startSearch  -> iş parçacığı başlatır, hemen döner
 *   searchState  -> JSON durum, JS 80 ms'de bir yoklar
 *   stop         -> aramayı keser
 *
 * Böylece hiçbir çağrı JS thread'ini bloke etmiyor.
 */

import { TurboModule, TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  readonly nativeVersion: () => string;

  readonly newGame: (fen: string) => boolean;

  /** JSON: { fen, side, status, check, legal[], history[] } */
  readonly snapshot: () => string;

  readonly makeMove: (uci: string) => boolean;
  readonly undo: () => boolean;
  readonly sanFor: (uci: string) => string;

  /** Arka planda arama başlatır. Zaten arama varsa hiçbir şey yapmaz. */
  readonly startSearch: (timeMs: number, maxDepth: number) => void;

  /** JSON: { running, move, depth, score, nodes, mate } */
  readonly searchState: () => string;

  /** Aramayı keser. Başka iş parçacığından güvenle çağrılabilir. */
  readonly stop: () => void;

  readonly setSkillLevel: (level: number) => void;
  readonly getSkillLevel: () => number;
  readonly setHashSizeMB: (mb: number) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeChessEngine');
