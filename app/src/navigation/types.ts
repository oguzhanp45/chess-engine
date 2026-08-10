/**
 * KONUM: app/src/navigation/types.ts   (yeni dosya)
 *
 * Hangi ekran hangi veriyi bekliyor. TypeScript bu sayede yanlış parametreyle
 * yapılan navigasyonu derleme anında yakalar.
 */

import type { GameSettings } from '../game/types';

export type PlayStackParamList = {
  NewGame: undefined;                    // parametre almaz
  Game: { settings: GameSettings };      // kurulum bilgisiyle açılır
};
