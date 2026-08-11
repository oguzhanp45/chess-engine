/**
 * KONUM: app/src/native/book.ts   (yeni dosya)
 *
 * Kitap Android varlıkları içinde. C++ tarafı okuyup motora veriyor.
 * Yükleme uygulama ömrü boyunca bir kez yapılır; sonuç burada saklanır.
 */

import NativeChessEngine from '../../specs/NativeChessEngine';

export type BookState = {
  loaded: boolean;
  entries: number;   // 16 bayt = 1 kayıt
  reason: string;    // başarısızsa sebep
};

const ASSET_NAME = 'book.bin';

let state: BookState = { loaded: false, entries: 0, reason: 'not-tried' };
let done = false;

export function getBookState(): BookState {
  return state;
}

/** Bir kez yükler. Tekrar çağrılması zararsız. */
export function ensureBookLoaded(): BookState {
  if (done) return state;

  try {
    const raw = JSON.parse(NativeChessEngine.loadBook(ASSET_NAME)) as {
      ok: boolean;
      bytes?: number;
      reason?: string;
    };
    if (raw.ok) {
      state = { loaded: true, entries: Math.floor((raw.bytes ?? 0) / 16), reason: '' };
      done = true;
    } else {
      state = { loaded: false, entries: 0, reason: raw.reason ?? 'unknown' };
      // 'searching' geçici bir durum; bir daha denenebilsin.
      done = raw.reason !== 'searching';
    }
  } catch (e) {
    state = { loaded: false, entries: 0, reason: String(e) };
    done = true;
  }
  return state;
}