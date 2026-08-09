/**
 * KONUM: app/src/native/nativeInfo.ts
 *
 * Spec dosyası doğrudan ekran kodundan çağrılmaz. Bu sarmalayıcı araya girer:
 * hata yakalama, tip dönüşümü ve ileride girdi hazırlama burada yapılır.
 *
 * Adım 3'te bu klasöre nativeEngine.ts eklenecek ve ChessEngine arayüzünü
 * uygulayacak.
 */

import NativeChessEngine from '../../specs/NativeChessEngine';

export function nativeVersion(): string {
  try {
    return NativeChessEngine.nativeVersion();
  } catch (e) {
    // Modül kayıtlı değilse veya derleme eskiyse buraya düşer.
    return `köprü yok: ${String(e)}`;
  }
}
