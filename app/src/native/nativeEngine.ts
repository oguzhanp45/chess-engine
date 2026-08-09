/**
 * KONUM: app/src/native/nativeEngine.ts   (yeni dosya)
 *
 * TurboModule çağrıları senkron; arayüzü Promise'e sarıyoruz. Adım 4'te
 * bestMove arka plana taşındığında yalnızca bu dosya değişecek.
 */

import NativeChessEngine from '../../specs/NativeChessEngine';
import type {
  ChessEngine,
  SearchInfo,
  Side,
  Snapshot,
  Status,
} from '../chess/engine';

type RawSnapshot = {
  fen: string;
  side: string;
  status: string;
  check: boolean;
  legal: string[];
  history: string[];
};

export class NativeEngine implements ChessEngine {
  async newGame(fen: string = ''): Promise<boolean> {
    return NativeChessEngine.newGame(fen);
  }

  async snapshot(): Promise<Snapshot> {
    const raw = JSON.parse(NativeChessEngine.snapshot()) as RawSnapshot;
    return {
      fen: raw.fen,
      sideToMove: raw.side as Side,
      status: raw.status as Status,
      inCheck: raw.check,
      legalMoves: raw.legal,
      historySan: raw.history,
    };
  }

  async makeMove(uci: string): Promise<boolean> {
    return NativeChessEngine.makeMove(uci);
  }

  async undo(): Promise<boolean> {
    return NativeChessEngine.undo();
  }

  async sanFor(uci: string): Promise<string> {
    return NativeChessEngine.sanFor(uci);
  }

  async bestMove(timeMs: number, maxDepth: number = 64): Promise<string> {
    // UYARI: bu çağrı bitene kadar arayüz donar. Adım 4'te düzelecek.
    return NativeChessEngine.bestMove(timeMs, maxDepth);
  }

  async stop(): Promise<void> {
    NativeChessEngine.stop();
  }

  async setSkillLevel(level: number): Promise<void> {
    NativeChessEngine.setSkillLevel(level);
  }

  async getSkillLevel(): Promise<number> {
    return NativeChessEngine.getSkillLevel();
  }

  async setHashSizeMB(mb: number): Promise<void> {
    NativeChessEngine.setHashSizeMB(mb);
  }

  async lastSearchInfo(): Promise<SearchInfo> {
    return JSON.parse(NativeChessEngine.lastSearchInfo()) as SearchInfo;
  }
}
