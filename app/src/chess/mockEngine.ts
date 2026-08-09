/**
 * GEÇİCİ. Adım 3'te bu dosya silinecek.
 *
 * Kural bilmez, taşı A'dan B'ye taşır. Amacı arayüzün motor cevabına doğru
 * tepki verdiğini görmek. legalMoves() bilerek boş dönüyor — sahte kural
 * üretmek, gerçek motor bağlanınca fark edilmeyen hatalara yol açar.
 */

import type { ChessEngine, Side } from './engine';
import {
  START_FEN,
  boardToPlacement,
  fenToBoard,
  squareToIndex,
  type BoardArray,
  type Piece,
} from './fen';

type Undo = { from: number; to: number; moved: Piece; captured: Piece | null };

export class MockEngine implements ChessEngine {
  private board: BoardArray = fenToBoard(START_FEN);
  private turn: Side = 'w';
  private history: string[] = [];
  private undoStack: Undo[] = [];

  async newGame(fen: string = START_FEN): Promise<void> {
    this.board = fenToBoard(fen);
    this.turn = fen.split(' ')[1] === 'b' ? 'b' : 'w';
    this.history = [];
    this.undoStack = [];
  }

  async getFen(): Promise<string> {
    const moveNo = Math.floor(this.history.length / 2) + 1;
    return `${boardToPlacement(this.board)} ${this.turn} - - 0 ${moveNo}`;
  }

  async sideToMove(): Promise<Side> {
    return this.turn;
  }

  async legalMoves(): Promise<string[]> {
    return [];
  }

  async gameStatus(): Promise<string> {
    return 'ongoing';
  }

  async makeMove(uci: string): Promise<boolean> {
    const from = squareToIndex(uci.slice(0, 2));
    const to = squareToIndex(uci.slice(2, 4));
    if (from < 0 || to < 0 || from === to) return false;

    const moved = this.board[from];
    if (moved === null) return false;

    this.undoStack.push({ from, to, moved, captured: this.board[to] });
    this.board[to] = moved;
    this.board[from] = null;
    this.turn = this.turn === 'w' ? 'b' : 'w';
    this.history.push(uci);
    return true;
  }

  async undo(): Promise<boolean> {
    const last = this.undoStack.pop();
    if (!last) return false;

    this.board[last.from] = last.moved;
    this.board[last.to] = last.captured;
    this.turn = this.turn === 'w' ? 'b' : 'w';
    this.history.pop();
    return true;
  }

  async sanFor(uci: string): Promise<string> {
    return uci;
  }

  async moveHistorySan(): Promise<string[]> {
    return [...this.history];
  }

  async bestMove(_timeMs: number): Promise<string> {
    return '';
  }

  async stop(): Promise<void> {}
  async setSkillLevel(_level: number): Promise<void> {}
  async setHashSizeMB(_mb: number): Promise<void> {}
}
