/**
 * KONUM: app/src/chess/engine.ts   (üzerine yaz)
 *
 * bestMove hâlâ Promise döndürüyor — ekran kodu değişmedi. Arkasında artık
 * yoklama var; ek olarak onProgress ile arama sürerken canlı bilgi geliyor.
 */

export type Side = 'w' | 'b';

export type Status =
  | 'ongoing'
  | 'checkmate'
  | 'stalemate'
  | 'draw-fifty'
  | 'draw-repetition'
  | 'draw-material';

export type Snapshot = {
  fen: string;
  sideToMove: Side;
  status: Status;
  inCheck: boolean;
  legalMoves: string[];
  historySan: string[];
};

export type SearchProgress = {
  depth: number;
  score: number;   // santipiyon, veya mate ise hamle sayısı
  nodes: number;
  mate: boolean;
};

export interface ChessEngine {
  newGame(fen?: string): Promise<boolean>;
  snapshot(): Promise<Snapshot>;

  makeMove(uci: string): Promise<boolean>;
  undo(): Promise<boolean>;
  sanFor(uci: string): Promise<string>;

  /** Arka planda arar. Arayüz donmaz. onProgress ~80 ms'de bir çağrılır. */
  bestMove(
    timeMs: number,
    maxDepth?: number,
    onProgress?: (p: SearchProgress) => void,
  ): Promise<string>;

  /** Aramayı keser. bestMove o ana kadarki en iyi hamleyle döner. */
  stop(): Promise<void>;

  setSkillLevel(level: number): Promise<void>;
  getSkillLevel(): Promise<number>;
  setHashSizeMB(mb: number): Promise<void>;
}

export const EMPTY_SNAPSHOT: Snapshot = {
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  sideToMove: 'w',
  status: 'ongoing',
  inCheck: false,
  legalMoves: [],
  historySan: [],
};

export function statusText(status: Status, side: Side): string {
  switch (status) {
    case 'ongoing':
      return 'Oyun sürüyor';
    case 'checkmate':
      return side === 'w' ? 'Mat — siyah kazandı' : 'Mat — beyaz kazandı';
    case 'stalemate':
      return 'Pat — beraberlik';
    case 'draw-fifty':
      return 'Beraberlik — 50 hamle kuralı';
    case 'draw-repetition':
      return 'Beraberlik — üç kez tekrar';
    case 'draw-material':
      return 'Beraberlik — yetersiz materyal';
    default:
      return String(status);
  }
}

/** Skoru okunur metne çevirir. */
export function scoreText(p: SearchProgress): string {
  if (p.mate) return `mat ${Math.abs(p.score)}`;
  return (p.score >= 0 ? '+' : '') + (p.score / 100).toFixed(2);
}
