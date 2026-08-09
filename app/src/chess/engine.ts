/**
 * KONUM: app/src/chess/engine.ts   (üzerine yaz)
 *
 * Motor sözleşmesi. EngineApi'nin beş ayrı sorgusu tek snapshot() altında
 * toplandı — köprü geçiş sayısını azaltmak için.
 */

export type Side = 'w' | 'b';

/** EngineApi.gameStatus() değerleri. */
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
  legalMoves: string[];   // ['e2e4', 'e7e8q', ...]
  historySan: string[];   // ['e4', 'Nf3', 'O-O', ...]
};

export type SearchInfo = {
  score: number;
  depth: number;
  nodes: number;
};

export interface ChessEngine {
  newGame(fen?: string): Promise<boolean>;
  snapshot(): Promise<Snapshot>;

  makeMove(uci: string): Promise<boolean>;
  undo(): Promise<boolean>;
  sanFor(uci: string): Promise<string>;

  bestMove(timeMs: number, maxDepth?: number): Promise<string>;
  stop(): Promise<void>;

  setSkillLevel(level: number): Promise<void>;
  getSkillLevel(): Promise<number>;
  setHashSizeMB(mb: number): Promise<void>;
  lastSearchInfo(): Promise<SearchInfo>;
}

export const EMPTY_SNAPSHOT: Snapshot = {
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  sideToMove: 'w',
  status: 'ongoing',
  inCheck: false,
  legalMoves: [],
  historySan: [],
};

/** Durum kodunu ekranda gösterilecek metne çevirir. */
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
