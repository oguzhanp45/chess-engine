/**
 * KONUM: app/src/chess/createEngine.ts   (üzerine yaz)
 *
 * Adım 3'te değişen tek seçim noktası. mockEngine.ts artık kullanılmıyor
 * ve silinecek.
 */

import type { ChessEngine } from './engine';
import { NativeEngine } from '../native/nativeEngine';

export const ENGINE_IS_MOCK = false;

export function createEngine(): ChessEngine {
  return new NativeEngine();
}
