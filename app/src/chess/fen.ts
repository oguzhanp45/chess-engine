/**
 * FEN <-> ekran dizisi çevirimi. Satranç KURALI yok, sadece biçim dönüşümü.
 * Motor bağlandığında bu dosya değişmez.
 *
 * İndeks düzeni: 0 = a8 (sol üst), 63 = h1 (sağ alt)
 */

export const START_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export type Piece =
  | 'P' | 'N' | 'B' | 'R' | 'Q' | 'K'
  | 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export type BoardArray = (Piece | null)[];

const FILES = 'abcdefgh';

export function fenToBoard(fen: string): BoardArray {
  const board: BoardArray = new Array(64).fill(null);
  const placement = fen.split(' ')[0] ?? '';
  let i = 0;

  for (const ch of placement) {
    if (ch === '/') continue;
    if (ch >= '1' && ch <= '8') {
      i += Number(ch);
    } else if (i < 64) {
      board[i] = ch as Piece;
      i += 1;
    }
  }
  return board;
}

/** 64'lük diziden FEN'in ilk alanını üretir. */
export function boardToPlacement(board: BoardArray): string {
  let out = '';
  for (let rank = 0; rank < 8; rank++) {
    let empty = 0;
    for (let file = 0; file < 8; file++) {
      const piece = board[rank * 8 + file];
      if (piece === null) {
        empty += 1;
      } else {
        if (empty > 0) { out += empty; empty = 0; }
        out += piece;
      }
    }
    if (empty > 0) out += empty;
    if (rank < 7) out += '/';
  }
  return out;
}

export function sideToMoveFromFen(fen: string): 'w' | 'b' {
  return fen.split(' ')[1] === 'b' ? 'b' : 'w';
}

export function indexToSquare(index: number): string {
  return FILES[index % 8] + String(8 - Math.floor(index / 8));
}

export function squareToIndex(square: string): number {
  const file = FILES.indexOf(square[0]);
  const rank = Number(square[1]);
  if (file < 0 || Number.isNaN(rank)) return -1;
  return (8 - rank) * 8 + file;
}

export function isWhitePiece(piece: Piece): boolean {
  return piece === piece.toUpperCase();
}

/** a8 açık karedir. */
export function isDarkSquare(index: number): boolean {
  return ((index % 8) + Math.floor(index / 8)) % 2 === 1;
}

/**
 * Her iki renk için de dolu sembol kullanılıyor; renk `color` ile veriliyor.
 * İçi boş semboller küçük karede kayboluyor. Adım 5'te SVG ile değişecek.
 */
const GLYPH: Record<string, string> = {
  k: '\u265A',
  q: '\u265B',
  r: '\u265C',
  b: '\u265D',
  n: '\u265E',
  p: '\u265F',
};

export function glyphFor(piece: Piece): string {
  return GLYPH[piece.toLowerCase()] ?? '';
}
