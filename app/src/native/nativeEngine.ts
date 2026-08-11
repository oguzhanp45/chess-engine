/**
 * KONUM: app/src/native/nativeEngine.ts   (üzerine yaz)
 *
 * Yoklama döngüsü burada. C++ tarafı startSearch/searchState/stop veriyor,
 * biz onu Promise'e sarıyoruz. Ekran kodu bu ayrıntıyı hiç görmüyor.
 */

import NativeChessEngine from '../../specs/NativeChessEngine';
import type {
  ChessEngine,
  SearchProgress,
  Side,
  Snapshot,
  Status,
} from '../chess/engine';

const POLL_MS = 80;

type RawSnapshot = {
  fen: string;
  side: string;
  status: string;
  check: boolean;
  legal: string[];
  history: string[];
};

type RawSearch = {
  running: boolean;
  move: string;
  depth: number;
  score: number;
  nodes: number;
  mate: boolean;
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

  async bestMove(
    timeMs: number,
    maxDepth: number = 64,
    onProgress?: (p: SearchProgress) => void,
  ): Promise<string> {
    NativeChessEngine.startSearch(timeMs, maxDepth);

    // Emniyet payı: motor beklenenden uzun sürerse kesip çıkıyoruz.
    // Sonsuz döngüde kalmak, donmaktan beterdir.
    const deadline = Date.now() + timeMs + 10000;

    for (;;) {
      await sleep(POLL_MS);
      const s = JSON.parse(NativeChessEngine.searchState()) as RawSearch;

      if (!s.running) return s.move;

      if (onProgress) {
        onProgress({
          depth: s.depth,
          score: s.score,
          nodes: s.nodes,
          mate: s.mate,
        });
      }

      if (Date.now() > deadline) {
        NativeChessEngine.stop();
      }
    }
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

  async setUseBook(on: boolean): Promise<void> {
    NativeChessEngine.setUseBook(on);
  }
}
