/**
 * KONUM: app/src/chess/geometry.ts   (yeni dosya)
 *
 * Kare adı <-> piksel dönüşümü. Saf fonksiyon, React yok, test edilebilir.
 * Sürükle-bırak ve animasyonun tamamı bu iki fonksiyona dayanıyor.
 *
 * Ekran düzeni: (0,0) tahtanın sol üst köşesi.
 */

const FILES = 'abcdefgh';

export type Geometry = {
  square: number;    // bir karenin kenar uzunluğu (piksel)
  flipped: boolean;  // siyah alttan mı görünüyor
};

/** 'e4' -> karenin sol üst köşesinin pikseli. */
export function squareToXY(square: string, g: Geometry): { x: number; y: number } {
  const file = FILES.indexOf(square[0]);
  const rank = Number(square[1]);

  const col = g.flipped ? 7 - file : file;
  const row = g.flipped ? rank - 1 : 8 - rank;

  return { x: col * g.square, y: row * g.square };
}

/** Piksel -> kare adı. Tahta dışındaysa null. */
export function xyToSquare(x: number, y: number, g: Geometry): string | null {
  const col = Math.floor(x / g.square);
  const row = Math.floor(y / g.square);
  if (col < 0 || col > 7 || row < 0 || row > 7) return null;

  const file = g.flipped ? 7 - col : col;
  const rank = g.flipped ? row + 1 : 8 - row;

  return FILES[file] + String(rank);
}

/** Kareyi ortalayan piksel — sürüklenen taşı parmağın altına oturtmak için. */
export function squareCenter(square: string, g: Geometry): { x: number; y: number } {
  const p = squareToXY(square, g);
  return { x: p.x + g.square / 2, y: p.y + g.square / 2 };
}
