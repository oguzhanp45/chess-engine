/**
 * Uygulamanın motoru buradan alır.
 *
 * ADIM 3'TE DEĞİŞECEK TEK DOSYA:
 *   import { NativeEngine } from './nativeEngine';
 *   export function createEngine(): ChessEngine { return new NativeEngine(); }
 *
 * Ekran kodunda hiçbir satır değişmeyecek.
 */

import type { ChessEngine } from './engine';
import { MockEngine } from './mockEngine';

/** Arayüzde uyarı rozeti göstermek için. Adım 3'te false olacak. */
export const ENGINE_IS_MOCK = true;

export function createEngine(): ChessEngine {
  return new MockEngine();
}
